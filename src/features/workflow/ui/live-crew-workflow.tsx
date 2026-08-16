import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Camera, Check, LoaderCircle, MapPin } from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";

import { ApiError } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/features/auth/model/auth-context";
import {
  asSupportedContentType,
  completeMediaUpload,
  createCaptureSession,
  createMediaUpload,
  listCaptureSessions,
  uploadCaptureFile,
} from "@/features/capture/api/capture-api";
import {
  checkIn,
  createFieldIssue,
  getFieldBrief,
  getMoveJob,
  listFieldIssues,
  shouldRecoverState,
  submitCompletion,
  workflowKeys,
  type Connection,
  type FieldIssue,
} from "@/features/workflow/api/workflow-api";
import { useAuthFailure } from "@/features/workflow/model/use-auth-failure";
import { useRetryAfter } from "@/features/workflow/model/use-retry-after";
import { ApiNotice, EmptyState, InvitationPanel, WorkflowShell } from "@/features/workflow/ui/workflow-shell";

export function LiveCrewWorkflow() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const references = useRef(new Map<string, string>());
  const completionCommand = useRef<{ dispatchId: string; input: Record<string, unknown> } | null>(null);
  const reference = (key: string) => {
    const current = references.current.get(key) ?? crypto.randomUUID();
    references.current.set(key, current);
    return current;
  };
  const [checkInKeys, setCheckInKeys] = useState<string[]>([]);
  const [completionKeys, setCompletionKeys] = useState<string[]>([]);
  const [issueType, setIssueType] = useState<FieldIssue["issue_type"]>("site_blocker");
  const [issueTitle, setIssueTitle] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [evidenceId, setEvidenceId] = useState<string | null>(null);
  const [completionMediaId, setCompletionMediaId] = useState<string | null>(null);
  const [onsiteConfirmed, setOnsiteConfirmed] = useState(false);
  const connection: Connection | null = session ? { accessToken: session.accessToken, jobId: session.actor.job_id } : null;
  const workflowEnabled = Boolean(connection && session?.actor.invitation?.status !== "pending");

  const briefQuery = useQuery({ enabled: workflowEnabled, queryKey: workflowKeys.brief(session?.actor.job_id ?? ""), queryFn: () => getFieldBrief(connection!) });
  const jobQuery = useQuery({ enabled: workflowEnabled, queryKey: [...workflowKeys.root(session?.actor.job_id ?? ""), "job"], queryFn: () => getMoveJob(connection!) });
  const issueQuery = useQuery({ enabled: workflowEnabled, queryKey: workflowKeys.fieldIssues(session?.actor.job_id ?? ""), queryFn: () => listFieldIssues(connection!) });
  const sessionsQuery = useQuery({
    enabled: workflowEnabled,
    queryKey: [...workflowKeys.root(session?.actor.job_id ?? ""), "media-sessions"],
    queryFn: () => listCaptureSessions({ accessToken: connection!.accessToken, jobId: connection!.jobId }),
    refetchInterval: (query) => query.state.data?.some((capture) => capture.media_assets.some((asset) => ["uploaded", "processing"].includes(asset.status))) ? 2_000 : false,
  });
  const completionMedia = sessionsQuery.data?.flatMap((capture) => capture.media_assets).find((asset) => asset.id === completionMediaId);

  const refreshBrief = () => queryClient.invalidateQueries({ queryKey: workflowKeys.brief(session!.actor.job_id) });
  const checkInMutation = useMutation({
    mutationFn: () => checkIn(connection!, briefQuery.data!.dispatch_id, checkInKeys),
    onError: async (error) => { if (shouldRecoverState(error)) await refreshBrief(); },
    onSuccess: refreshBrief,
  });
  const uploadMutation = useMutation({
    mutationFn: async ({ file, purpose }: { file: File; purpose: "change_evidence" | "completion" }) => {
      const roomZoneId = jobQuery.data?.locations.flatMap((location) => location.room_zones)[0]?.id;
      if (!roomZoneId) throw new Error("업로드할 작업 공간이 없습니다.");
      const capture = await createCaptureSession(connection!);
      const target = await createMediaUpload({
        ...connection!,
        captureSessionId: capture.id,
        contentLength: file.size,
        contentType: asSupportedContentType(file),
        mediaPurpose: purpose,
        roomZoneId,
      });
      await uploadCaptureFile(target, file);
      const asset = await completeMediaUpload({ ...connection!, captureSessionId: capture.id, mediaAssetId: target.asset.id });
      return { asset, purpose };
    },
    onSuccess: async ({ asset, purpose }) => {
      if (purpose === "change_evidence") setEvidenceId(asset.id);
      else setCompletionMediaId(asset.id);
      await queryClient.invalidateQueries({ queryKey: [...workflowKeys.root(session!.actor.job_id), "media-sessions"] });
    },
  });
  const issueMutation = useMutation({
    mutationFn: () => createFieldIssue(connection!, {
      client_reference: reference(JSON.stringify([
        "field-issue",
        briefQuery.data!.scope_version_id,
        issueType,
        issueTitle.trim(),
        issueDescription.trim(),
        evidenceId,
      ])),
      base_scope_version_id: briefQuery.data!.scope_version_id,
      issue_type: issueType,
      title: issueTitle.trim(),
      description: issueDescription.trim(),
      evidence_media_asset_ids: [evidenceId!],
    }),
    onError: async (error) => { if (shouldRecoverState(error)) await Promise.all([refreshBrief(), queryClient.invalidateQueries({ queryKey: workflowKeys.fieldIssues(session!.actor.job_id) })]); },
    onSuccess: async () => {
      setIssueTitle("");
      setIssueDescription("");
      setEvidenceId(null);
      await queryClient.invalidateQueries({ queryKey: workflowKeys.fieldIssues(session!.actor.job_id) });
    },
  });
  const completionMutation = useMutation({
    mutationFn: () => {
      const now = new Date();
      const checkedIn = briefQuery.data!.checked_in_at ? new Date(briefQuery.data!.checked_in_at) : new Date(now.getTime() - 60_000);
      const startedAt = checkedIn > now ? new Date(now.getTime() - 60_000) : checkedIn;
      const input = {
        client_reference: reference(`completion:${briefQuery.data!.dispatch_id}`),
        dispatch_id: briefQuery.data!.dispatch_id,
        scope_version_id: briefQuery.data!.scope_version_id,
        completion_media_asset_ids: completionMedia?.status === "ready" ? [completionMedia.id] : [],
        completed_check_keys: completionKeys,
        worker_shifts: briefQuery.data!.assigned_workers.map((worker) => ({ worker_id: worker.worker_id, started_at: startedAt.toISOString(), ended_at: now.toISOString() })),
        onsite_customer_confirmed: true,
        onsite_confirmed_at: now.toISOString(),
        work_ended_at: now.toISOString(),
      };
      if (completionCommand.current?.dispatchId !== briefQuery.data!.dispatch_id) {
        completionCommand.current = { dispatchId: briefQuery.data!.dispatch_id, input };
      }
      return submitCompletion(connection!, completionCommand.current.input);
    },
    onError: async (error) => {
      if (error instanceof ApiError && error.status === 422) completionCommand.current = null;
      if (shouldRecoverState(error)) await refreshBrief();
    },
    onSuccess: refreshBrief,
  });

  const mutationError = checkInMutation.error ?? uploadMutation.error ?? issueMutation.error ?? completionMutation.error;
  const retryAfter = useRetryAfter(mutationError);
  useAuthFailure(briefQuery.error, jobQuery.error, issueQuery.error, sessionsQuery.error, mutationError);
  if (!connection || session?.actor.role !== "field_worker") return null;
  const brief = briefQuery.data;
  const allCheckIn = Boolean(brief && brief.check_in_items.every((item) => checkInKeys.includes(item.key)));
  const allCompletion = Boolean(brief && brief.completion_check_items.every((item) => completionKeys.includes(item.key)));
  const uploadFile = (purpose: "change_evidence" | "completion") => (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) uploadMutation.mutate({ file, purpose });
    event.target.value = "";
  };

  return (
    <WorkflowShell retryAfter={retryAfter} title="오늘 현장 작업">
      <InvitationPanel />
      {session.actor.invitation?.status === "pending" ? null : <>
      <Card className="p-5">
        <p className="text-sm font-bold text-primary-700">배차 · 체크인</p><h2 className="mt-1 text-xl font-extrabold">현장 브리프</h2>
        {briefQuery.isLoading ? <EmptyState>확정된 배차와 작업범위를 불러오는 중입니다.</EmptyState> : null}
        <ApiNotice error={briefQuery.error} title="배차 정보가 아직 준비되지 않았어요" />
        {brief ? <><div className="mt-4 rounded-xl bg-canvas p-4"><p className="font-bold"><MapPin className="mr-1 inline size-4" /> {brief.masked_origin ?? "출발지"} → {brief.masked_destination ?? "도착지"}</p><p className="mt-2 text-sm text-ink-600">{brief.scope_version_label} · {brief.assigned_vehicle.display_name} · {brief.assigned_worker_count}명</p><p className="mt-2 text-sm font-bold text-warning-ink">{brief.safety_notice}</p></div><div className="mt-4 space-y-2">{brief.check_in_items.map((item) => <label className="flex min-h-12 items-center gap-3 rounded-xl border border-line p-3" key={item.key}><input checked={item.confirmed || checkInKeys.includes(item.key)} disabled={Boolean(brief.checked_in_at)} onChange={(event) => setCheckInKeys((current) => event.target.checked ? [...current, item.key] : current.filter((key) => key !== item.key))} type="checkbox" /><span className="font-bold">{item.label}</span></label>)}</div><Button className="mt-4 w-full" disabled={Boolean(brief.checked_in_at) || !allCheckIn || checkInMutation.isPending} onClick={() => checkInMutation.mutate()} size="cta">{brief.checked_in_at ? <><Check /> 체크인 완료</> : "현장 도착 체크인"}</Button></> : null}
        <ApiNotice error={checkInMutation.error} title="체크인을 처리하지 못했어요" />
      </Card>

      <Card className="p-5">
        <p className="text-sm font-bold text-warning-ink">현장 변경</p><h2 className="mt-1 text-xl font-extrabold">업체에 이슈 보고</h2>
        <div className="mt-4 space-y-3">
          <Label htmlFor="issue-type">유형</Label><select className="h-12 w-full rounded-xl border border-input bg-white px-4" id="issue-type" onChange={(event) => setIssueType(event.target.value as FieldIssue["issue_type"])} value={issueType}><option value="out_of_scope">범위 밖 작업</option><option value="damage_risk">파손 위험</option><option value="site_blocker">현장 장애</option></select>
          <Label htmlFor="issue-title">제목</Label><Input id="issue-title" maxLength={200} onChange={(event) => setIssueTitle(event.target.value)} value={issueTitle} />
          <Label htmlFor="issue-description">현장 설명</Label><Textarea id="issue-description" maxLength={2000} onChange={(event) => setIssueDescription(event.target.value)} value={issueDescription} />
          <Label className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 font-bold"><Camera /> {evidenceId ? "증빙 업로드 완료" : uploadMutation.isPending ? "업로드 중..." : "증빙 사진 선택"}<input accept="image/jpeg,image/png,video/mp4" className="sr-only" disabled={uploadMutation.isPending} onChange={uploadFile("change_evidence")} type="file" /></Label>
          <Button className="w-full" disabled={!brief || !brief.checked_in_at || !evidenceId || !issueTitle.trim() || !issueDescription.trim() || issueMutation.isPending} onClick={() => issueMutation.mutate()} size="cta"><AlertTriangle /> 업체에 이슈 보고</Button>
        </div>
        <ApiNotice error={uploadMutation.error ?? issueMutation.error} title="현장 이슈를 처리하지 못했어요" />
        <div className="mt-4 space-y-2">{issueQuery.data?.map((issue) => <div className="rounded-xl bg-canvas p-3" key={issue.field_issue_id}><b>{issue.title}</b><p className="mt-1 text-xs text-ink-600">{issue.status} · {new Date(issue.reported_at).toLocaleString("ko-KR")}</p></div>)}</div>
      </Card>

      <Card className="p-5">
        <p className="text-sm font-bold text-success-ink">완료 제출</p><h2 className="mt-1 text-xl font-extrabold">작업 완료 기록</h2>
        {brief?.completion_submission_id ? <div className="mt-4 rounded-xl bg-success-bg p-4 font-bold text-success-ink"><Check className="mr-1 inline" /> 완료 기록 제출됨</div> : <><div className="mt-4 space-y-2">{brief?.completion_check_items.map((item) => <label className="flex min-h-12 items-center gap-3 rounded-xl border border-line p-3" key={item.key}><input checked={completionKeys.includes(item.key)} onChange={(event) => setCompletionKeys((current) => event.target.checked ? [...current, item.key] : current.filter((key) => key !== item.key))} type="checkbox" /><span className="font-bold">{item.label}</span></label>)}</div><label className="mt-4 flex min-h-12 items-center gap-3 rounded-xl border border-line p-3"><input checked={onsiteConfirmed} onChange={(event) => setOnsiteConfirmed(event.target.checked)} type="checkbox" /><span className="font-bold">고객이 현장에서 완료를 확인했어요</span></label><Label className="mt-3 flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 font-bold"><Camera /> {completionMedia?.status === "ready" ? "완료 사진 준비됨" : completionMedia ? `완료 사진 ${completionMedia.status}` : "완료 사진 선택 (선택)"}<input accept="image/jpeg,image/png,video/mp4" className="sr-only" disabled={uploadMutation.isPending} onChange={uploadFile("completion")} type="file" /></Label><p className="mt-2 text-xs text-ink-600">사진 없이도 제출할 수 있으며, 선택한 사진은 READY 이후 포함됩니다.</p><Button className="mt-4 w-full" disabled={!brief?.checked_in_at || !allCompletion || !onsiteConfirmed || completionMutation.isPending || Boolean(completionMedia && completionMedia.status !== "ready")} onClick={() => completionMutation.mutate()} size="cta">{completionMutation.isPending ? <><LoaderCircle className="animate-spin" /> 제출 중...</> : "작업 완료 기록 제출"}</Button></>}
        <ApiNotice error={completionMutation.error} title="완료 기록을 제출하지 못했어요" />
      </Card>
      </>}
    </WorkflowShell>
  );
}
