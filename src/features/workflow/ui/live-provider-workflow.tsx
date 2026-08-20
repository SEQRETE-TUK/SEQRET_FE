import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckIcon as Check,
  CopyIcon as Copy,
  PaperPlaneTiltIcon as Send,
  TruckIcon as Truck,
  UsersIcon as Users,
} from "@phosphor-icons/react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { StatusTag, WorkContext } from "@/components/layout/app-primitives";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { WorkflowTask } from "@/components/workflow/workflow-task";
import { mockApiEnabled } from "@/api/mock-api";
import { useAuth } from "@/features/auth/model/auth-context";
import {
  createCompletionRequest,
  getCompletionSummary,
  getDispatch,
  listFieldIssues,
  getMoveJob,
  getScopeReview,
  shouldRecoverState,
  setupDispatch,
  confirmDispatch,
  workflowKeys,
  type Connection,
} from "@/features/workflow/api/workflow-api";
import { useAuthFailure } from "@/features/workflow/model/use-auth-failure";
import { useRetryAfter } from "@/features/workflow/model/use-retry-after";
import { ApiNotice, EmptyState, WorkflowShell } from "@/features/workflow/ui/workflow-shell";

const moneyFormatter = new Intl.NumberFormat("ko-KR");
const money = (value: number | null | undefined) => value == null ? "금액 미정" : `${moneyFormatter.format(value)}원`;
const eventTimeFormatter = new Intl.DateTimeFormat("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
export function LiveProviderWorkflow({ embedded = false, wide = false }: { embedded?: boolean; wide?: boolean }) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const references = useRef(new Map<string, string>());
  const reference = (key: string) => {
    const current = references.current.get(key) ?? crypto.randomUUID();
    references.current.set(key, current);
    return current;
  };
  const [vehicleName, setVehicleName] = useState("5톤 탑차");
  const [vehicleCapacity, setVehicleCapacity] = useState("28");
  const [duration, setDuration] = useState("480");
  const [workerNote, setWorkerNote] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [selectedWorkerIds, setSelectedWorkerIds] = useState<string[]>([]);
  const [connectionCodeCopied, setConnectionCodeCopied] = useState(false);
  const connection: Connection | null = session ? { accessToken: session.accessToken, jobId: session.actor.job_id } : null;
  const invitationPending = session?.actor.invitation?.status === "pending";

  const canReadJob = Boolean(connection && !invitationPending);
  const scopeQuery = useQuery({ enabled: canReadJob, queryKey: workflowKeys.scope(session?.actor.job_id ?? ""), queryFn: () => getScopeReview(connection!) });
  const jobQuery = useQuery({ enabled: canReadJob, queryKey: ["move-job", session?.actor.job_id], queryFn: () => getMoveJob(connection!), refetchInterval: 2_000 });
  const dispatchQuery = useQuery({ enabled: canReadJob && Boolean(scopeQuery.data), queryKey: workflowKeys.dispatch(session?.actor.job_id ?? ""), queryFn: () => getDispatch(connection!) });
  const completionQuery = useQuery({ enabled: canReadJob, queryKey: workflowKeys.completion(session?.actor.job_id ?? ""), queryFn: () => getCompletionSummary(connection!) });
  const issueQuery = useQuery({ enabled: canReadJob, queryKey: workflowKeys.fieldIssues(session?.actor.job_id ?? ""), queryFn: () => listFieldIssues(connection!), refetchInterval: mockApiEnabled ? 2_000 : false });

  const invalidate = (...keys: readonly (readonly unknown[])[]) => Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
  const setupMutation = useMutation({
    mutationFn: () => {
      const worker = jobQuery.data!.participants.find((participant) => participant.role === "field_worker")!;
      const input = {
        source_scope_version_id: scopeQuery.data!.scope.id,
        expected_duration_minutes: Number(duration),
        required_vehicle_capacity_m2: Number(vehicleCapacity),
        required_worker_count: 1,
        required_skills: [],
        required_certifications: [],
        check_in_items: [
          { key: "vehicle_checked", label: "차량과 적재 장비 확인" },
          { key: "scope_checked", label: "최신 작업범위 확인" },
          { key: "safety_checked", label: "현장 안전사항 확인" },
        ],
        origin_conditions: scopeQuery.data!.job.origin_summary ? [scopeQuery.data!.job.origin_summary] : [],
        safety_notice: "승인된 작업범위 밖 작업은 먼저 현장 이슈로 보고해 주세요.",
        vehicles: [{
          external_reference: "vehicle-primary",
          display_name: vehicleName.trim(),
          specification: `${vehicleCapacity}㎡ 적재`,
          equipment: [],
          capacity_m2: Number(vehicleCapacity),
          available: true,
          conflict_reason: null,
        }],
        workers: [{
          external_reference: "worker-1",
          display_name: worker.display_name,
          role_label: "팀장",
          skills: [],
          certifications: [],
          available: true,
          conflict_reason: null,
          participant_id: worker.id,
        }],
      };
      return setupDispatch(connection!, {
        client_reference: reference(JSON.stringify(["dispatch", input])),
        ...input,
      });
    },
    onError: async (error) => { if (shouldRecoverState(error)) await invalidate(workflowKeys.dispatch(session!.actor.job_id)); },
    onSuccess: async (view) => {
      setSelectedVehicleId(view.vehicle_options.find((vehicle) => vehicle.available)?.id ?? "");
      setSelectedWorkerIds(view.worker_options.filter((worker) => worker.available).map((worker) => worker.id));
      await invalidate(workflowKeys.dispatch(session!.actor.job_id));
    },
  });
  const dispatchMutation = useMutation({
    mutationFn: () => {
      const view = dispatchQuery.data!;
      const workers = selectedWorkerIds.length ? selectedWorkerIds : view.worker_options.filter((worker) => worker.available).map((worker) => worker.id);
      const vehicle = selectedVehicleId || view.vehicle_options.find((option) => option.available)!.id;
      return confirmDispatch(connection!, { setup_id: view.setup_id!, vehicle_id: vehicle, lead_worker_id: workers[0], worker_ids: workers, worker_note: workerNote.trim() || null });
    },
    onError: async (error) => { if (shouldRecoverState(error)) await invalidate(workflowKeys.dispatch(session!.actor.job_id)); },
    onSuccess: async () => { await invalidate(workflowKeys.dispatch(session!.actor.job_id)); },
  });
  const completionRequestMutation = useMutation({
    mutationFn: () => createCompletionRequest(connection!, completionQuery.data!.completion_submission_id!, reference(`completion-request:${completionQuery.data!.completion_submission_id}`)),
    onError: async (error) => { if (shouldRecoverState(error)) await invalidate(workflowKeys.completion(session!.actor.job_id)); },
    onSuccess: async () => { await invalidate(workflowKeys.completion(session!.actor.job_id)); },
  });
  const mutationError = setupMutation.error ?? dispatchMutation.error ?? completionRequestMutation.error;
  const retryAfter = useRetryAfter(mutationError);
  useAuthFailure(scopeQuery.error, jobQuery.error, dispatchQuery.error, completionQuery.error, issueQuery.error, mutationError);
  if (!connection || session?.actor.role !== "company_manager") return null;
  const connectedWorker = jobQuery.data?.participants.find((participant) => participant.role === "field_worker");
  const unresolvedFieldIssueCount = (issueQuery.data ?? []).filter((issue) => issue.status !== "approved" && issue.status !== "rejected").length;
  const operationStep = !connectedWorker ? 0 : dispatchQuery.data?.status !== "confirmed" ? 1 : completionQuery.data?.completion_submission_id ? 3 : 2;
  const copyConnectionCode = async () => {
    if (!scopeQuery.data) return;
    try {
      await navigator.clipboard.writeText(scopeQuery.data.job.job_code);
      setConnectionCodeCopied(true);
      window.setTimeout(() => setConnectionCodeCopied(false), 1500);
    } catch {
      // Clipboard permissions are handled by the browser.
    }
  };

  return (
    <WorkflowShell
      context={scopeQuery.data ? <WorkContext
        route={`${scopeQuery.data.job.origin_summary ?? "출발지 미정"} → ${scopeQuery.data.job.destination_summary ?? "도착지 미정"}`}
        scheduledAt={scopeQuery.data.job.scheduled_at}
        status={<StatusTag tone={scopeQuery.data.scope.status === "confirmed" ? "success" : "warning"}>{scopeQuery.data.scope.status === "confirmed" ? "공동확인 완료" : scopeQuery.data.scope.status === "customer_review" ? "고객 확인 대기" : "업체 처리 중"}</StatusTag>}
        title={scopeQuery.data.job.title}
        version={scopeQuery.data.scope.version_label}
      /> : undefined}
      currentStep={operationStep}
      retryAfter={retryAfter}
      stepLabels={["기사 연결", "배차", "현장 진행", "완료 확인"]}
      summary="이사 연결 코드 공유부터 배차 확정, 완료 증빙과 고객 확인 요청까지 이어서 처리합니다."
      title="배차·완료 진행"
      embedded={embedded}
      wide={wide}
    >
      <div className="workflow-task-list overflow-hidden rounded-[var(--radius-input)] border border-line bg-surface">
        <WorkflowTask
          description={connectedWorker ? `${connectedWorker.display_name} 기사 연결 완료` : "고객·업체와 같은 코드를 기사에게 전달해요"}
          index={0}
          presentation="dialog"
          status={connectedWorker ? "연결됨" : "연결 대기"}
          title="기사 연결"
          tone={connectedWorker ? "success" : "primary"}
        >
          <p className="mt-4 rounded-[var(--radius-card)] bg-primary-50 p-4 text-center font-mono text-lg font-black tracking-wide text-primary-800">{scopeQuery.data?.job.job_code ?? "코드 준비 중"}</p>
          <Button className="mt-3 w-full" disabled={!scopeQuery.data} onClick={() => void copyConnectionCode()} variant="outline"><Copy aria-hidden="true" />{connectionCodeCopied ? "복사됨" : "연결 코드 복사"}</Button>
        </WorkflowTask>
        {!scopeQuery.data ? <p className="border-t border-line px-5 py-6 text-sm leading-6 text-ink-600">고객의 촬영과 짐 검수가 끝나면 배차와 완료 단계를 진행할 수 있습니다.</p> : <>
        <WorkflowTask
          description={`${connectedWorker ? "연결 기사 1명" : "기사 연결 대기"} · 차량과 작업시간을 배정해요`}
          index={1}
          presentation="dialog"
          status={dispatchQuery.data?.status === "confirmed" ? "확정" : dispatchQuery.data?.status === "ready" ? "확정 필요" : "준비"}
          title="배차"
          tone={dispatchQuery.data?.status === "confirmed" ? "success" : dispatchQuery.data?.status === "ready" ? "primary" : "neutral"}
        >
          <ApiNotice error={dispatchQuery.error} />
          {dispatchQuery.data?.status === "confirmed" ? <div className="mt-4 rounded-[var(--radius-card)] bg-success-bg p-4 text-success-ink"><Check aria-hidden="true" className="inline" /> 배차 확정 · {dispatchQuery.data.confirmed_at ? eventTimeFormatter.format(new Date(dispatchQuery.data.confirmed_at)) : "시간 확인 중"}</div> : null}
          {(!dispatchQuery.data || dispatchQuery.data.status === "setup_required") ? <form className="mt-4 space-y-3" onSubmit={(event) => { event.preventDefault(); setupMutation.mutate(); }}><div className="grid grid-cols-2 gap-2"><div><Label htmlFor="vehicle-name">차량</Label><Input autoComplete="off" id="vehicle-name" name="vehicleName" onChange={(event) => setVehicleName(event.target.value)} value={vehicleName} /></div><div><Label htmlFor="capacity">적재 ㎡</Label><Input autoComplete="off" id="capacity" inputMode="decimal" min="0" name="vehicleCapacity" onChange={(event) => setVehicleCapacity(event.target.value)} type="number" value={vehicleCapacity} /></div></div><Label htmlFor="duration">예상 작업시간(분)</Label><Input autoComplete="off" id="duration" inputMode="numeric" min="1" max="720" name="durationMinutes" onChange={(event) => setDuration(event.target.value)} type="number" value={duration} /><p className="rounded-xl bg-canvas p-3 text-sm"><Users aria-hidden="true" className="mr-1 inline size-4" /> {connectedWorker ? `연결 기사 · ${connectedWorker.display_name}` : "현장기사 연결 대기"}</p><Button className="w-full" disabled={!scopeQuery.data || !connectedWorker || setupMutation.isPending} type="submit"><Truck aria-hidden="true" /> 배차 후보 등록</Button></form> : null}
          {dispatchQuery.data && ["ready", "stale"].includes(dispatchQuery.data.status) ? <div className="mt-4 space-y-3"><div className="space-y-2">{dispatchQuery.data.vehicle_options.map((vehicle) => <button className={`w-full rounded-xl border p-3 text-left ${selectedVehicleId === vehicle.id ? "border-primary-400 bg-primary-50" : "border-line"}`} disabled={!vehicle.available} key={vehicle.id} onClick={() => setSelectedVehicleId(vehicle.id)} type="button"><b>{vehicle.display_name}</b><p className="text-xs text-ink-600">{vehicle.capacity_m2}㎡ · {vehicle.conflict_reason ?? "사용 가능"}</p></button>)}</div><div className="space-y-2">{dispatchQuery.data.worker_options.map((worker) => <label className="flex items-center gap-3 rounded-xl border border-line p-3" key={worker.id}><input checked={selectedWorkerIds.includes(worker.id)} disabled={!worker.available} name="workerIds" onChange={(event) => setSelectedWorkerIds((current) => event.target.checked ? [...current, worker.id] : current.filter((id) => id !== worker.id))} type="checkbox" value={worker.id} /><span><b>{worker.display_name}</b><span className="block text-xs text-ink-600">{worker.conflict_reason ?? worker.role_label}</span></span></label>)}</div><Label htmlFor="worker-note">기사 전달 메모</Label><Textarea autoComplete="off" id="worker-note" name="workerNote" onChange={(event) => setWorkerNote(event.target.value)} value={workerNote} /><Button className="w-full" disabled={dispatchMutation.isPending || dispatchQuery.data.status === "stale"} onClick={() => dispatchMutation.mutate()} size="cta">배차 확정</Button></div> : null}
          <ApiNotice error={setupMutation.error ?? dispatchMutation.error} title="배차를 처리하지 못했어요" />
        </WorkflowTask>

        <WorkflowTask
          description={completionQuery.data?.completion_submission_id ? "고객 확인 요청과 완료 문서를 처리해요" : "현장기사의 완료 제출을 기다려요"}
          index={2}
          presentation="dialog"
          status={completionQuery.data?.archive_ready ? "문서 준비" : completionQuery.data?.completion_submission_id ? "확인 요청" : "대기"}
          title="완료와 문서"
          tone={completionQuery.data?.archive_ready ? "success" : "neutral"}
        >
          <ApiNotice error={completionQuery.error} title="완료 기록이 아직 준비되지 않았어요" />
          {completionQuery.data ? <CompletionReview summary={completionQuery.data} /> : <EmptyState>현장기사의 완료 제출을 기다리고 있습니다.</EmptyState>}
          {unresolvedFieldIssueCount ? <p className="mt-4 rounded-xl bg-warning-bg p-3 text-sm font-bold text-warning-ink">처리되지 않은 현장 보고 {unresolvedFieldIssueCount}건을 먼저 업체·고객이 처리해야 완료 확인을 요청할 수 있어요.</p> : null}
          {completionQuery.data ? <Button className="mt-4 w-full" disabled={!completionQuery.data.completion_submission_id || unresolvedFieldIssueCount > 0 || ["requested", "confirmed", "issue_reported"].includes(completionQuery.data.completion_request?.status ?? "") || completionRequestMutation.isPending} onClick={() => completionRequestMutation.mutate()}><Send aria-hidden="true" /> 고객 완료 확인 요청</Button> : null}
          <ApiNotice error={completionRequestMutation.error} title="완료 요청을 처리하지 못했어요" />
        </WorkflowTask>
        </>}
      </div>
    </WorkflowShell>
  );
}

function CompletionReview({ summary }: { summary: Awaited<ReturnType<typeof getCompletionSummary>> }) {
  const requestStatus = ({ requested: "고객 확인 대기", confirmed: "고객 확인 완료", issue_reported: "고객 문제 제기", revoked: "요청 철회", expired: "요청 만료", not_requested: "전송 전" } as Record<string, string>)[summary.completion_request?.status ?? "not_requested"];
  return <div className="mt-4 space-y-4">
    <div className="rounded-[var(--radius-card)] bg-canvas p-4"><p className="text-ui-support text-ink-600">완료 기록 금액</p><strong className="text-ui-section tabular-nums">{money(summary.final_amount_krw)}</strong><p className="mt-2 text-ui-support text-ink-600">완료 제출 {summary.completion_submission_id ? "수신" : "대기"} · {requestStatus}</p></div>
    {summary.completion_submission_id ? <>
      <dl className="grid grid-cols-2 gap-2 text-sm"><div className="rounded-xl border border-line p-3"><dt className="text-ink-600">체크리스트</dt><dd className="mt-1 font-extrabold">{summary.checklist.completed_count}/{summary.checklist.total_count}</dd></div><div className="rounded-xl border border-line p-3"><dt className="text-ink-600">작업 시간</dt><dd className="mt-1 font-extrabold">{summary.duration_minutes ?? "–"}분</dd></div><div className="rounded-xl border border-line p-3"><dt className="text-ink-600">현장 확인</dt><dd className="mt-1 font-extrabold">{summary.onsite_confirmation_completed ? "완료" : "미완료"}</dd></div><div className="rounded-xl border border-line p-3"><dt className="text-ink-600">완료 사진</dt><dd className="mt-1 font-extrabold">{summary.completion_media_count}건</dd></div></dl>
      {summary.completion_media.length ? <div><p className="text-sm font-extrabold">완료 사진</p><div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">{summary.completion_media.map((asset, index) => asset.content_type.startsWith("image/") ? <img alt={`${asset.room_zone_label} 완료 사진 ${index + 1}`} className="aspect-square w-full rounded-[var(--radius-card)] object-cover" height="480" key={asset.media_asset_id} loading="lazy" src={asset.read_url} width="480" /> : <video className="aspect-square w-full rounded-[var(--radius-card)] bg-ink-900 object-cover" controls key={asset.media_asset_id} preload="metadata" src={asset.read_url} />)}</div></div> : <p className="rounded-[var(--radius-card)] bg-warning-bg p-3 text-sm font-bold text-warning-ink">완료 사진이 없습니다. 고객 요청 전에 기사에게 증빙을 확인해 주세요.</p>}
      {summary.worker_shifts.length ? <div><p className="text-sm font-extrabold">작업자 기록</p><div className="mt-2 divide-y divide-line rounded-xl border border-line px-4">{summary.worker_shifts.map((shift) => <p className="flex justify-between gap-3 py-3 text-sm" key={shift.worker_id}><span>{shift.display_name} · {shift.role_label}</span><strong>{shift.duration_minutes}분</strong></p>)}</div></div> : null}
      {summary.field_changes.length ? <div><p className="text-sm font-extrabold">현장 변경 반영</p><div className="mt-2 divide-y divide-line rounded-xl border border-line px-4">{summary.field_changes.map((change) => <div className="py-3 text-sm" key={change.proposal_id}><p className="flex justify-between gap-3"><span>{change.title}</span><strong>{money(change.amount_delta_krw)}</strong></p><p className="mt-1 text-xs text-ink-600">{change.status}</p></div>)}</div></div> : null}
      {summary.completion_request?.problem_report ? <div className="rounded-xl border border-danger bg-danger-bg p-4"><p className="font-extrabold text-danger-ink">고객이 문제를 남겼어요</p><p className="mt-2 text-sm leading-6 text-ink-600">{summary.completion_request.problem_report.description}</p></div> : null}
    </> : null}
  </div>;
}
