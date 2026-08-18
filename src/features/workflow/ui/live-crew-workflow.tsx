import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CameraIcon as Camera,
  CheckIcon as Check,
  CircleNotchIcon as LoaderCircle,
  MapPinIcon as MapPin,
} from "@phosphor-icons/react";
import {
  WarningStatusIcon as AlertTriangle,
} from "@/components/icons";
import { useRef, useState, type ChangeEvent } from "react";

import { ApiError } from "@/api/client";
import { HandoffStatus, StatusTag, WorkContext } from "@/components/layout/app-primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { WorkflowTask } from "@/components/workflow/workflow-task";
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
import { ApiNotice, EmptyState, WorkflowShell } from "@/features/workflow/ui/workflow-shell";

const eventTimeFormatter = new Intl.DateTimeFormat("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });

export function LiveCrewWorkflow({ embedded = false }: { embedded?: boolean }) {
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
  // 촬영 session 생성 시 backend로 보내는 개인정보 고지 확인 값.
  const [privacyAcknowledged, setPrivacyAcknowledged] = useState(false);
  const connection: Connection | null = session ? { accessToken: session.accessToken, jobId: session.actor.job_id } : null;

  const briefQuery = useQuery({ enabled: Boolean(connection), queryKey: workflowKeys.brief(session?.actor.job_id ?? ""), queryFn: () => getFieldBrief(connection!) });
  const jobQuery = useQuery({ enabled: Boolean(connection), queryKey: [...workflowKeys.root(session?.actor.job_id ?? ""), "job"], queryFn: () => getMoveJob(connection!) });
  const issueQuery = useQuery({ enabled: Boolean(connection), queryKey: workflowKeys.fieldIssues(session?.actor.job_id ?? ""), queryFn: () => listFieldIssues(connection!) });
  const sessionsQuery = useQuery({
    enabled: Boolean(connection),
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
      const capture = await createCaptureSession({ ...connection!, privacyNoticeAcknowledged: privacyAcknowledged });
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
    <WorkflowShell
      context={brief ? <WorkContext
        code={brief.job.job_code}
        route={`${brief.masked_origin ?? "출발지 미정"} → ${brief.masked_destination ?? "도착지 미정"}`}
        scheduledAt={brief.start_at}
        status={<StatusTag tone={brief.checked_in_at ? "success" : "warning"}>{brief.checked_in_at ? "현장 진행" : "체크인 전"}</StatusTag>}
        title={brief.job.title}
        version={brief.scope_version_label}
      /> : undefined}
      currentStep={brief?.completion_submission_id ? 4 : 3}
      retryAfter={retryAfter}
      summary="현장에서는 체크인, 이슈 보고, 완료 기록만 순서대로 처리합니다."
      title="오늘 현장 작업"
      embedded={embedded}
    >
      <div className="workflow-task-list mt-3 overflow-hidden rounded-[var(--radius-input)] border border-line bg-surface">
      <WorkflowTask
        description={brief ? `${brief.assigned_vehicle.display_name} · ${brief.assigned_worker_count}명` : "배차와 최신 작업범위를 먼저 확인해요"}
        index={1}
        status={brief?.checked_in_at ? "완료" : "먼저 처리"}
        title="현장 체크인"
        tone={brief?.checked_in_at ? "success" : "primary"}
      >
        {briefQuery.isLoading ? <EmptyState>확정된 배차와 작업범위를 불러오는 중입니다.</EmptyState> : null}
        <ApiNotice error={briefQuery.error} title="배차 정보가 아직 준비되지 않았어요" />
        {brief ? <><HandoffStatus action="배차와 승인 범위를 확인해 주세요" actor="현장기사" updatedAt={brief.checked_in_at}>체크인은 도착 사실과 사전 확인 항목을 기록합니다. 고객이나 업체 대신 범위·금액을 확정하지 않습니다.</HandoffStatus><div className="mt-4 rounded-xl bg-canvas p-4"><p className="font-bold"><MapPin aria-hidden="true" className="mr-1 inline size-4" /> {brief.masked_origin ?? "출발지"} → {brief.masked_destination ?? "도착지"}</p><p className="mt-2 text-sm text-ink-600">{brief.scope_version_label} · {brief.assigned_vehicle.display_name} · {brief.assigned_worker_count}명</p><p className="mt-2 text-sm font-bold text-warning-ink">{brief.safety_notice}</p></div><div className="mt-4 space-y-2">{brief.check_in_items.map((item) => <label className="flex min-h-12 items-center gap-3 rounded-xl border border-line p-3" key={item.key}><input checked={item.confirmed || checkInKeys.includes(item.key)} disabled={Boolean(brief.checked_in_at)} name="checkInItems" onChange={(event) => setCheckInKeys((current) => event.target.checked ? [...current, item.key] : current.filter((key) => key !== item.key))} type="checkbox" value={item.key} /><span className="font-bold">{item.label}</span></label>)}</div><Button className="mt-4 w-full" disabled={Boolean(brief.checked_in_at) || !allCheckIn || checkInMutation.isPending} onClick={() => checkInMutation.mutate()} size="cta">{brief.checked_in_at ? <><Check aria-hidden="true" /> 체크인 완료</> : "확인 후 현장 체크인"}</Button></> : null}
        <ApiNotice error={checkInMutation.error} title="체크인을 처리하지 못했어요" />
      </WorkflowTask>

      <WorkflowTask
        description={`보고된 현장 이슈 ${issueQuery.data?.length ?? 0}건 · 사진 근거를 함께 남겨요`}
        index={2}
        status={issueQuery.data?.some((issue) => issue.status === "open") ? "처리 중" : "필요할 때"}
        title="현장 이슈"
        tone={issueQuery.data?.some((issue) => issue.status === "open") ? "warning" : "neutral"}
      >
        <div className="mt-4 space-y-3">
          <Label htmlFor="issue-type">유형</Label><Select autoComplete="off" id="issue-type" name="issueType" onChange={(event) => setIssueType(event.target.value as FieldIssue["issue_type"])} value={issueType}><option value="out_of_scope">범위 밖 작업</option><option value="damage_risk">파손 위험</option><option value="site_blocker">현장 장애</option></Select>
          <Label htmlFor="issue-title">제목</Label><Input autoComplete="off" id="issue-title" maxLength={200} name="issueTitle" onChange={(event) => setIssueTitle(event.target.value)} value={issueTitle} />
          <Label htmlFor="issue-description">현장 설명</Label><Textarea autoComplete="off" id="issue-description" maxLength={2000} name="issueDescription" onChange={(event) => setIssueDescription(event.target.value)} value={issueDescription} />
          <label className="mb-2 flex items-start gap-3 rounded-xl border border-line p-3 text-sm text-ink-600"><input checked={privacyAcknowledged} name="privacyNoticeAcknowledged" onChange={(event) => setPrivacyAcknowledged(event.target.checked)} type="checkbox" /><span>현장 촬영본은 변경 근거 확인에만 사용되고 보존 기간 후 삭제돼요. 개인정보 수집·이용 고지를 확인했어요.</span></label>
          <Label className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 font-bold" data-disabled={!privacyAcknowledged || undefined}><Camera aria-hidden="true" /> {evidenceId ? "증빙 업로드 완료" : uploadMutation.isPending ? "업로드 중…" : privacyAcknowledged ? "증빙 사진 선택" : "고지 확인 후 촬영할 수 있어요"}<input accept="image/jpeg,image/png,video/mp4" className="sr-only" disabled={uploadMutation.isPending || !privacyAcknowledged} name="changeEvidence" onChange={uploadFile("change_evidence")} type="file" /></Label>
          <Button className="w-full" disabled={!brief || !brief.checked_in_at || !evidenceId || !issueTitle.trim() || !issueDescription.trim() || issueMutation.isPending} onClick={() => issueMutation.mutate()} size="cta"><AlertTriangle aria-hidden="true" /> 업체에 이슈 보고</Button>
        </div>
        <ApiNotice error={uploadMutation.error ?? issueMutation.error} title="현장 이슈를 처리하지 못했어요" />
        <div className="mt-4 space-y-2">{issueQuery.data?.map((issue) => <div className="rounded-xl bg-canvas p-3" key={issue.field_issue_id}><b>{issue.title}</b><p className="mt-1 text-xs text-ink-600">{issue.status} · {eventTimeFormatter.format(new Date(issue.reported_at))}</p></div>)}</div>
      </WorkflowTask>

      <WorkflowTask
        description={brief?.completion_submission_id ? "완료 기록이 업체와 고객에게 전달됐어요" : "체크리스트와 현장 확인을 묶어 제출해요"}
        index={3}
        status={brief?.completion_submission_id ? "제출됨" : "대기"}
        title="완료 제출"
        tone={brief?.completion_submission_id ? "success" : "neutral"}
      >
        {brief?.completion_submission_id ? <div className="mt-4 rounded-xl bg-success-bg p-4 font-bold text-success-ink"><Check aria-hidden="true" className="mr-1 inline" /> 완료 기록 제출됨</div> : <><div className="mt-4 space-y-2">{brief?.completion_check_items.map((item) => <label className="flex min-h-12 items-center gap-3 rounded-xl border border-line p-3" key={item.key}><input checked={completionKeys.includes(item.key)} name="completionItems" onChange={(event) => setCompletionKeys((current) => event.target.checked ? [...current, item.key] : current.filter((key) => key !== item.key))} type="checkbox" value={item.key} /><span className="font-bold">{item.label}</span></label>)}</div><label className="mt-4 flex min-h-12 items-center gap-3 rounded-xl border border-line p-3"><input checked={onsiteConfirmed} name="onsiteConfirmed" onChange={(event) => setOnsiteConfirmed(event.target.checked)} type="checkbox" /><span className="font-bold">고객이 현장에서 완료를 확인했어요</span></label><Label className="mt-3 flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 font-bold"><Camera aria-hidden="true" /> {completionMedia?.status === "ready" ? "완료 사진 준비됨" : completionMedia ? `완료 사진 ${completionMedia.status}` : "완료 사진 선택 (선택)"}<input accept="image/jpeg,image/png,video/mp4" className="sr-only" disabled={uploadMutation.isPending || !privacyAcknowledged} name="completionEvidence" onChange={uploadFile("completion")} type="file" /></Label><p className="mt-2 text-xs text-ink-600">사진 없이도 제출할 수 있으며, 선택한 사진은 READY 이후 포함됩니다.</p><Button className="mt-4 w-full" disabled={!brief?.checked_in_at || !allCompletion || !onsiteConfirmed || completionMutation.isPending || Boolean(completionMedia && completionMedia.status !== "ready")} onClick={() => completionMutation.mutate()} size="cta">{completionMutation.isPending ? <><LoaderCircle aria-hidden="true" className="animate-spin" /> 제출 중…</> : "작업 완료 기록 제출"}</Button></>}
        <ApiNotice error={completionMutation.error} title="완료 기록을 제출하지 못했어요" />
      </WorkflowTask>
      </div>
    </WorkflowShell>
  );
}
