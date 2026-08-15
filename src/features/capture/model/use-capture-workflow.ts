import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import {
  asSupportedContentType,
  completeAnalysisReview,
  completeMediaUpload,
  createCaptureSession,
  createManualScope,
  createMediaUpload,
  getMoveJob,
  getAnalysisReview,
  listScopeVersions,
  listCaptureSessions,
  submitCapture,
  uploadCaptureFile,
  type CaptureSession,
  type CompleteAnalysisReviewRequest,
  type MediaUploadTarget,
  type AnalysisReviewItemInput,
} from "@/features/capture/api/capture-api";
import { SignedUploadError } from "@/api/client";

export interface CaptureConnection {
  accessToken: string;
  cacheScope: string;
  jobId: string;
}

interface StartUploadInput {
  captureSessionId: string;
  file: File;
  roomZoneId: string;
}

interface ResumableUpload {
  captureSessionId: string;
  file: File;
  stage: "upload" | "complete";
  target: MediaUploadTarget;
}

const ACTIVE_ANALYSIS_STATUSES = new Set([
  "pending",
  "dispatching",
  "queued",
  "running",
]);

function needsPolling(sessions: CaptureSession[] | undefined): boolean {
  return Boolean(
    sessions?.some(
      (session) =>
        session.media_assets.some((asset) =>
          ["uploaded", "processing"].includes(asset.status),
        ) ||
        (session.analysis !== null && ACTIVE_ANALYSIS_STATUSES.has(session.analysis.status)),
    ),
  );
}

export function useCaptureWorkflow(connection: CaptureConnection) {
  const queryClient = useQueryClient();
  const [resumableUpload, setResumableUpload] = useState<ResumableUpload | null>(null);
  const rootKey = ["capture-flow", connection.cacheScope, connection.jobId] as const;
  const sessionsKey = [...rootKey, "sessions"] as const;
  const reviewKey = [...rootKey, "analysis-review"] as const;
  const scopeVersionsKey = [...rootKey, "scope-versions"] as const;

  const jobQuery = useQuery({
    queryKey: [...rootKey, "job"],
    queryFn: ({ signal }) => getMoveJob({ ...connection, signal }),
  });

  const sessionsQuery = useQuery({
    queryKey: sessionsKey,
    queryFn: ({ signal }) => listCaptureSessions({ ...connection, signal }),
    refetchInterval: (query) => (needsPolling(query.state.data) ? 2_000 : false),
  });

  const latestAnalysisStatus = sessionsQuery.data?.[0]?.analysis?.status;
  const reviewQuery = useQuery({
    enabled: latestAnalysisStatus === "completed",
    queryKey: reviewKey,
    queryFn: ({ signal }) => getAnalysisReview({ ...connection, signal }),
  });

  const scopeVersionsQuery = useQuery({
    queryKey: scopeVersionsKey,
    queryFn: ({ signal }) => listScopeVersions({ ...connection, signal }),
  });

  const refreshSessions = async () => {
    await queryClient.invalidateQueries({ queryKey: sessionsKey });
  };

  const refreshReview = async () => {
    await refreshSessions();
    return reviewQuery.refetch();
  };

  const createSessionMutation = useMutation({
    mutationFn: () => createCaptureSession(connection),
    onSuccess: async () => {
      setResumableUpload(null);
      await refreshSessions();
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (input?: StartUploadInput) => {
      let resumable = resumableUpload;
      if (input) {
        const target = await createMediaUpload({
          ...connection,
          captureSessionId: input.captureSessionId,
          contentLength: input.file.size,
          contentType: asSupportedContentType(input.file),
          roomZoneId: input.roomZoneId,
        });
        resumable = {
          captureSessionId: input.captureSessionId,
          file: input.file,
          stage: "upload",
          target,
        };
        setResumableUpload(resumable);
      }
      if (!resumable) {
        throw new Error("No upload is available to retry");
      }
      if (
        resumable.stage === "upload" &&
        Date.parse(resumable.target.expires_at) <= Date.now()
      ) {
        setResumableUpload(null);
        throw new Error("The signed upload has expired");
      }
      if (resumable.stage === "upload") {
        try {
          await uploadCaptureFile(resumable.target, resumable.file);
        } catch (error) {
          if (!(error instanceof SignedUploadError && error.status === 412)) {
            throw error;
          }
        }
        resumable = { ...resumable, stage: "complete" };
        setResumableUpload(resumable);
      }
      await completeMediaUpload({
        ...connection,
        captureSessionId: resumable.captureSessionId,
        mediaAssetId: resumable.target.asset.id,
      });
      setResumableUpload(null);
    },
    onSettled: refreshSessions,
  });

  const submitMutation = useMutation({
    mutationFn: (captureSessionId: string) =>
      submitCapture({ ...connection, captureSessionId }),
    onSuccess: refreshSessions,
  });

  const reviewMutation = useMutation({
    mutationFn: (
      command: Pick<CompleteAnalysisReviewRequest, "items" | "sourceScopeVersionId">,
    ) => completeAnalysisReview({ ...connection, ...command }),
    onSuccess: (review) => {
      queryClient.setQueryData(reviewKey, review);
    },
  });

  const manualScopeMutation = useMutation({
    mutationFn: ({ items, parentVersionId }: { items: AnalysisReviewItemInput[]; parentVersionId: string | null }) =>
      createManualScope({ ...connection, items, parentVersionId }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: scopeVersionsKey });
    },
  });

  return {
    createSessionMutation,
    jobQuery,
    manualScopeMutation,
    reviewMutation,
    reviewQuery,
    refreshReview,
    refreshSessions,
    resumableUpload,
    sessionsQuery,
    scopeVersionsQuery,
    submitMutation,
    uploadMutation,
  };
}
