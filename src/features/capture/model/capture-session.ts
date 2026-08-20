import type {
  AnalysisReview,
  CaptureSession,
} from "@/features/capture/api/capture-api";

const ACTIVE_ANALYSIS_STATUSES = new Set(["pending", "dispatching", "queued", "running"]);
const RESUMABLE_VIDEO_STATUSES = new Set(["uploaded", "processing", "ready"]);

function hasInventoryVideo(session: CaptureSession): boolean {
  return session.media_assets.some(
    (asset) => asset.media_purpose === "inventory" && asset.content_type === "video/mp4",
  );
}

export function findResumableVideoSession(sessions: CaptureSession[]): CaptureSession | null {
  return sessions.find((session) => {
    if (!hasInventoryVideo(session)) return false;
    if (session.analysis) return ACTIVE_ANALYSIS_STATUSES.has(session.analysis.status);
    return session.media_assets.some(
      (asset) => asset.media_purpose === "inventory"
        && asset.content_type === "video/mp4"
        && RESUMABLE_VIDEO_STATUSES.has(asset.status),
    );
  }) ?? null;
}

export function findCompletedVideoSession(sessions: CaptureSession[]): CaptureSession | null {
  return sessions.find(
    (session) => hasInventoryVideo(session) && session.analysis?.status === "completed",
  ) ?? null;
}

export function findPendingVideoReviewSession(
  sessions: CaptureSession[],
  review: AnalysisReview | undefined,
): CaptureSession | null {
  if (!review || review.review_scope_version_id !== null) return null;
  const session = sessions.find(({ id }) => id === review.capture_session_id);
  return session && hasInventoryVideo(session) && session.analysis?.status === "completed"
    ? session
    : null;
}
