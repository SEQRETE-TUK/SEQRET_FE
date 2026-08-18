import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckIcon as Check,
  DownloadSimpleIcon as Download,
  CircleNotchIcon as LoaderCircle,
  PaperPlaneTiltIcon as Send,
  TruckIcon as Truck,
  UsersIcon as Users,
} from "@phosphor-icons/react";
import { useRef, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { HandoffStatus, StatusTag, WorkContext } from "@/components/layout/app-primitives";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { WorkflowTask } from "@/components/workflow/workflow-task";
import { useAuth } from "@/features/auth/model/auth-context";
import {
  createChangeProposal,
  createCompletionRequest,
  createScopeProposal,
  downloadCompletionArchive,
  explainChangeProposal,
  getChangeProposal,
  getCompletionSummary,
  getDispatch,
  getScopeReview,
  listFieldIssues,
  listInvitations,
  scopeContentFromReview,
  shouldRecoverState,
  setupDispatch,
  confirmDispatch,
  workflowKeys,
  type Connection,
} from "@/features/workflow/api/workflow-api";
import { useAuthFailure } from "@/features/workflow/model/use-auth-failure";
import { useRetryAfter } from "@/features/workflow/model/use-retry-after";
import { ApiNotice, EmptyState, InvitationPanel, WorkflowShell } from "@/features/workflow/ui/workflow-shell";

const moneyFormatter = new Intl.NumberFormat("ko-KR");
const money = (value: number | null | undefined) => value == null ? "금액 미정" : `${moneyFormatter.format(value)}원`;
const eventTimeFormatter = new Intl.DateTimeFormat("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
const issueStatusLabel = (status: string) => ({ reported: "업체 확인 전", quoted: "변경안 전달", clarification_requested: "설명 요청", explained: "설명 제출", approved: "고객 승인", rejected: "고객 거절" })[status] ?? "상태 확인 중";
export function LiveProviderWorkflow({ embedded = false, wide = false }: { embedded?: boolean; wide?: boolean }) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const references = useRef(new Map<string, string>());
  const reference = (key: string) => {
    const current = references.current.get(key) ?? crypto.randomUUID();
    references.current.set(key, current);
    return current;
  };
  const [quoteAmount, setQuoteAmount] = useState("");
  const [quoteReason, setQuoteReason] = useState("현장 조건과 작업 항목을 반영한 견적입니다.");
  const [selectedIssueId, setSelectedIssueId] = useState("");
  const [changeAmount, setChangeAmount] = useState("0");
  const [changeReason, setChangeReason] = useState("");
  const [explanation, setExplanation] = useState("");
  const [vehicleName, setVehicleName] = useState("5톤 탑차");
  const [vehicleCapacity, setVehicleCapacity] = useState("28");
  const [duration, setDuration] = useState("480");
  const [workerNote, setWorkerNote] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [selectedWorkerIds, setSelectedWorkerIds] = useState<string[]>([]);
  const [downloadError, setDownloadError] = useState<unknown>(null);
  const connection: Connection | null = session ? { accessToken: session.accessToken, jobId: session.actor.job_id } : null;

  const scopeQuery = useQuery({ enabled: Boolean(connection), queryKey: workflowKeys.scope(session?.actor.job_id ?? ""), queryFn: () => getScopeReview(connection!) });
  const issueQuery = useQuery({ enabled: Boolean(connection), queryKey: workflowKeys.fieldIssues(session?.actor.job_id ?? ""), queryFn: () => listFieldIssues(connection!) });
  const invitationQuery = useQuery({ enabled: Boolean(connection), queryKey: workflowKeys.invitations(session?.actor.job_id ?? ""), queryFn: () => listInvitations(connection!) });
  const dispatchQuery = useQuery({ enabled: Boolean(connection), queryKey: workflowKeys.dispatch(session?.actor.job_id ?? ""), queryFn: () => getDispatch(connection!) });
  const completionQuery = useQuery({ enabled: Boolean(connection), queryKey: workflowKeys.completion(session?.actor.job_id ?? ""), queryFn: () => getCompletionSummary(connection!) });
  const selectedIssue = issueQuery.data?.find((issue) => issue.field_issue_id === selectedIssueId) ?? issueQuery.data?.find((issue) => issue.status === "open") ?? null;
  const proposalId = selectedIssue?.change_proposal_id ?? "";
  const proposalQuery = useQuery({
    enabled: Boolean(connection && proposalId),
    queryKey: workflowKeys.proposal(session?.actor.job_id ?? "", proposalId),
    queryFn: () => getChangeProposal(connection!, proposalId),
  });

  const invalidate = (...keys: readonly (readonly unknown[])[]) => Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
  const scopeMutation = useMutation({
    mutationFn: () => createScopeProposal(connection!, {
      source_scope_version_id: scopeQuery.data!.scope.id,
      content: scopeContentFromReview(scopeQuery.data!),
      quote: { base_amount_krw: Number(quoteAmount), adjustments: [], total_amount_krw: Number(quoteAmount) },
      execution_plan: {
        vehicle_count: 1,
        vehicle_description: vehicleName.trim(),
        worker_count: Math.max(1, invitationQuery.data?.invitations.filter((invitation) => invitation.role === "field_worker" && invitation.status === "accepted").length ?? 0),
        estimated_duration_minutes: Number(duration),
        notes: workerNote.trim() || null,
      },
      included_works: scopeQuery.data!.scope.included_works,
      exclusions: scopeQuery.data!.scope.exclusions,
      reason: quoteReason.trim(),
    }),
    onError: async (error) => { if (shouldRecoverState(error)) await invalidate(workflowKeys.scope(session!.actor.job_id)); },
    onSuccess: async () => { await invalidate(workflowKeys.scope(session!.actor.job_id)); },
  });
  const proposalMutation = useMutation({
    mutationFn: () => {
      const base = scopeQuery.data?.quote?.total_amount_krw ?? 0;
      const delta = Number(changeAmount);
      return createChangeProposal(connection!, {
        field_issue_id: selectedIssue!.field_issue_id,
        base_scope_version_id: selectedIssue!.base_scope_version_id,
        title: selectedIssue!.title,
        reason: changeReason.trim(),
        proposed_content: scopeContentFromReview(scopeQuery.data!),
        quote: { base_amount_krw: base, adjustments: [{ label: selectedIssue!.title, amount_krw: delta }], total_amount_krw: base + delta },
      });
    },
    onError: async (error) => { if (shouldRecoverState(error)) await invalidate(workflowKeys.fieldIssues(session!.actor.job_id), workflowKeys.scope(session!.actor.job_id)); },
    onSuccess: async () => { await invalidate(workflowKeys.fieldIssues(session!.actor.job_id)); },
  });
  const explanationMutation = useMutation({
    mutationFn: () => explainChangeProposal(connection!, proposalId, explanation.trim()),
    onSuccess: async () => { setExplanation(""); await invalidate(workflowKeys.proposal(session!.actor.job_id, proposalId)); },
  });
  const setupMutation = useMutation({
    mutationFn: () => {
      const acceptedWorkers = invitationQuery.data!.invitations.filter((invitation) => invitation.role === "field_worker" && invitation.status === "accepted");
      const input = {
        source_scope_version_id: scopeQuery.data!.scope.id,
        expected_duration_minutes: Number(duration),
        required_vehicle_capacity_m2: Number(vehicleCapacity),
        required_worker_count: acceptedWorkers.length,
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
        workers: acceptedWorkers.map((invitation, index) => ({
          external_reference: `worker-${index + 1}`,
          display_name: invitation.display_name,
          role_label: index === 0 ? "팀장" : "작업자",
          skills: [],
          certifications: [],
          available: true,
          conflict_reason: null,
          participant_id: invitation.invitee_participant_id,
        })),
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
  const archiveMutation = useMutation({
    mutationFn: () => downloadCompletionArchive(connection!),
    onSuccess: ({ blob, filename }) => {
      setDownloadError(null);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    },
    onError: setDownloadError,
  });

  const mutationError = scopeMutation.error ?? proposalMutation.error ?? explanationMutation.error ?? setupMutation.error ?? dispatchMutation.error ?? completionRequestMutation.error ?? downloadError;
  const retryAfter = useRetryAfter(mutationError);
  useAuthFailure(scopeQuery.error, issueQuery.error, invitationQuery.error, dispatchQuery.error, completionQuery.error, proposalQuery.error, mutationError);
  if (!connection || session?.actor.role !== "company_manager") return null;
  const acceptedWorkerCount = invitationQuery.data?.invitations.filter((invitation) => invitation.role === "field_worker" && invitation.status === "accepted").length ?? 0;
  const scopeStatus = scopeQuery.data?.scope.status;
  const canProposeScope = scopeStatus === "company_review" || scopeStatus === "revision_requested";

  return (
    <WorkflowShell
      context={scopeQuery.data ? <WorkContext
        code={scopeQuery.data.job.job_code}
        route={`${scopeQuery.data.job.origin_summary ?? "출발지 미정"} → ${scopeQuery.data.job.destination_summary ?? "도착지 미정"}`}
        scheduledAt={scopeQuery.data.job.scheduled_at}
        status={<StatusTag tone={scopeQuery.data.scope.status === "confirmed" ? "success" : "warning"}>{scopeQuery.data.scope.status === "confirmed" ? "공동확인 완료" : scopeQuery.data.scope.status === "customer_review" ? "고객 확인 대기" : "업체 처리 중"}</StatusTag>}
        title={scopeQuery.data.job.title}
        version={scopeQuery.data.scope.version_label}
      /> : undefined}
      currentStep={scopeStatus !== "confirmed" ? 1 : dispatchQuery.data?.status !== "confirmed" ? 2 : selectedIssue ? 3 : completionQuery.data?.completion_submission_id ? 4 : 3}
      retryAfter={retryAfter}
      summary="견적, 현장 변경, 배차, 완료 문서를 단계별 작업으로 나눠 필요한 화면만 엽니다."
      title="업체 운영"
      embedded={embedded}
      wide={wide}
    >
      <InvitationPanel />
      <div className={wide ? "workflow-task-grid workflow-task-list mt-3 overflow-hidden rounded-[var(--radius-input)] border border-line bg-surface lg:grid lg:grid-cols-2" : "workflow-task-list mt-3 overflow-hidden rounded-[var(--radius-input)] border border-line bg-surface"}>
        <WorkflowTask
          description={scopeQuery.data ? `${scopeQuery.data.scope.item_count}개 항목 · ${scopeQuery.data.scope.version_label}` : "고객 범위를 불러온 뒤 견적을 작성해요"}
          index={1}
          status={scopeStatus === "confirmed" ? "확정" : scopeStatus === "customer_review" ? "고객 응답 대기" : scopeStatus === "revision_requested" ? "수정 필요" : "작성 가능"}
          title="범위와 견적"
          tone={scopeStatus === "confirmed" ? "success" : scopeStatus === "customer_review" ? "warning" : "primary"}
        >
          <ApiNotice error={scopeQuery.error} />
          {scopeQuery.data ? <><HandoffStatus action={canProposeScope ? "작업과 금액을 하나의 버전으로 제안하세요" : "고객의 응답을 기다리고 있어요"} actor={canProposeScope ? "업체" : "고객"} updatedAt={scopeQuery.data.revision_request?.requested_at ?? scopeQuery.data.company_confirmed_at}>{canProposeScope ? "고객이 수정 요청을 보낸 경우 기존 제안을 고치지 않고 새 버전을 보냅니다. 고객 확인 전에는 현장 실행 기준이 바뀌지 않습니다." : "현재 제안은 그대로 보존됩니다. 고객이 확인하거나 수정 요청을 보낸 뒤 다음 작업을 진행하세요."}</HandoffStatus><p className="mt-4 text-sm text-ink-600">기준 {scopeQuery.data.scope.version_label} · 항목 {scopeQuery.data.scope.item_count}개 · 제외 {scopeQuery.data.scope.exclusion_count}개</p><form className="mt-4 space-y-3" onSubmit={(event: FormEvent) => { event.preventDefault(); if (canProposeScope) scopeMutation.mutate(); }}><Label htmlFor="quote-amount">총 견적 금액</Label><Input autoComplete="off" disabled={!canProposeScope} id="quote-amount" inputMode="numeric" min="0" name="quoteAmount" onChange={(event) => setQuoteAmount(event.target.value)} required type="number" value={quoteAmount} /><Label htmlFor="quote-reason">견적 사유</Label><Textarea autoComplete="off" disabled={!canProposeScope} id="quote-reason" maxLength={2000} name="quoteReason" onChange={(event) => setQuoteReason(event.target.value)} required value={quoteReason} /><Button className="w-full" disabled={!canProposeScope || !Number(quoteAmount) || !quoteReason.trim() || scopeMutation.isPending} size="cta" type="submit"><Send aria-hidden="true" /> 새 제안 보내기</Button></form></> : <EmptyState>작업범위가 준비되면 견적을 보낼 수 있습니다.</EmptyState>}
          <ApiNotice error={scopeMutation.error} title="견적 제안을 처리하지 못했어요" />
        </WorkflowTask>

        <WorkflowTask
          description={selectedIssue ? `${selectedIssue.title} · 증빙 ${selectedIssue.evidence_media_asset_ids.length}건` : "현장기사 보고를 고객 변경안으로 전환해요"}
          index={2}
          status={selectedIssue ? "처리 필요" : "대기"}
          title="현장 변경"
          tone={selectedIssue ? "warning" : "neutral"}
        >
          <ApiNotice error={issueQuery.error} />
          <div className="mt-4 space-y-2">{issueQuery.data?.map((issue) => <button className={`w-full rounded-xl border p-3 text-left ${selectedIssue?.field_issue_id === issue.field_issue_id ? "border-primary-400 bg-primary-50" : "border-line"}`} key={issue.field_issue_id} onClick={() => setSelectedIssueId(issue.field_issue_id)} type="button"><b>{issue.title}</b><p className="mt-1 text-xs text-ink-600">{issueStatusLabel(issue.status)} · 증빙 {issue.evidence_media_asset_ids.length}건</p></button>)}</div>
          {selectedIssue && !selectedIssue.change_proposal_id ? <form className="mt-4 space-y-3" onSubmit={(event) => { event.preventDefault(); proposalMutation.mutate(); }}><Label htmlFor="change-amount">증감 금액</Label><Input autoComplete="off" id="change-amount" inputMode="numeric" name="changeAmount" onChange={(event) => setChangeAmount(event.target.value)} type="number" value={changeAmount} /><Label htmlFor="change-reason">고객에게 보일 사유</Label><Textarea autoComplete="off" id="change-reason" maxLength={2000} name="changeReason" onChange={(event) => setChangeReason(event.target.value)} required value={changeReason} /><p className="text-sm font-bold text-primary-800">변경 후 {money((scopeQuery.data?.quote?.total_amount_krw ?? 0) + Number(changeAmount))}</p><Button className="w-full" disabled={!scopeQuery.data || !changeReason.trim() || proposalMutation.isPending} type="submit">변경안 고객에게 보내기</Button></form> : null}
          {proposalQuery.data ? <div className="mt-4 rounded-xl bg-canvas p-4"><b>제안 상태: {proposalQuery.data.status}</b><p className="mt-1 text-sm text-ink-600">{money(proposalQuery.data.quote.total_amount_krw)}</p>{proposalQuery.data.clarification_requested_at && !proposalQuery.data.explanation ? <div className="mt-3 space-y-2"><Label htmlFor="proposal-explanation">고객 설명 요청 답변</Label><Textarea autoComplete="off" id="proposal-explanation" name="proposalExplanation" onChange={(event) => setExplanation(event.target.value)} value={explanation} /><Button className="w-full" disabled={!explanation.trim() || explanationMutation.isPending} onClick={() => explanationMutation.mutate()}>설명 제출</Button></div> : null}</div> : null}
          <ApiNotice error={proposalMutation.error ?? explanationMutation.error} title="현장 변경을 처리하지 못했어요" />
        </WorkflowTask>

        <WorkflowTask
          description={`수락 기사 ${acceptedWorkerCount}명 · 차량과 작업시간을 배정해요`}
          index={3}
          status={dispatchQuery.data?.status === "confirmed" ? "확정" : dispatchQuery.data?.status === "ready" ? "확정 필요" : "준비"}
          title="배차"
          tone={dispatchQuery.data?.status === "confirmed" ? "success" : dispatchQuery.data?.status === "ready" ? "primary" : "neutral"}
        >
          <ApiNotice error={dispatchQuery.error} />
          {dispatchQuery.data?.status === "confirmed" ? <div className="mt-4 rounded-xl bg-success-bg p-4 text-success-ink"><Check aria-hidden="true" className="inline" /> 배차 확정 · {dispatchQuery.data.confirmed_at ? eventTimeFormatter.format(new Date(dispatchQuery.data.confirmed_at)) : "시간 확인 중"}</div> : null}
          {(!dispatchQuery.data || dispatchQuery.data.status === "setup_required") ? <form className="mt-4 space-y-3" onSubmit={(event) => { event.preventDefault(); setupMutation.mutate(); }}><div className="grid grid-cols-2 gap-2"><div><Label htmlFor="vehicle-name">차량</Label><Input autoComplete="off" id="vehicle-name" name="vehicleName" onChange={(event) => setVehicleName(event.target.value)} value={vehicleName} /></div><div><Label htmlFor="capacity">적재 ㎡</Label><Input autoComplete="off" id="capacity" inputMode="decimal" min="0" name="vehicleCapacity" onChange={(event) => setVehicleCapacity(event.target.value)} type="number" value={vehicleCapacity} /></div></div><Label htmlFor="duration">예상 작업시간(분)</Label><Input autoComplete="off" id="duration" inputMode="numeric" min="1" max="720" name="durationMinutes" onChange={(event) => setDuration(event.target.value)} type="number" value={duration} /><p className="rounded-xl bg-canvas p-3 text-sm"><Users aria-hidden="true" className="mr-1 inline size-4" /> 수락한 현장기사 {acceptedWorkerCount}명</p><Button className="w-full" disabled={!scopeQuery.data || acceptedWorkerCount === 0 || setupMutation.isPending} type="submit"><Truck aria-hidden="true" /> 배차 후보 등록</Button></form> : null}
          {dispatchQuery.data && ["ready", "stale"].includes(dispatchQuery.data.status) ? <div className="mt-4 space-y-3"><div className="space-y-2">{dispatchQuery.data.vehicle_options.map((vehicle) => <button className={`w-full rounded-xl border p-3 text-left ${selectedVehicleId === vehicle.id ? "border-primary-400 bg-primary-50" : "border-line"}`} disabled={!vehicle.available} key={vehicle.id} onClick={() => setSelectedVehicleId(vehicle.id)} type="button"><b>{vehicle.display_name}</b><p className="text-xs text-ink-600">{vehicle.capacity_m2}㎡ · {vehicle.conflict_reason ?? "사용 가능"}</p></button>)}</div><div className="space-y-2">{dispatchQuery.data.worker_options.map((worker) => <label className="flex items-center gap-3 rounded-xl border border-line p-3" key={worker.id}><input checked={selectedWorkerIds.includes(worker.id)} disabled={!worker.available} name="workerIds" onChange={(event) => setSelectedWorkerIds((current) => event.target.checked ? [...current, worker.id] : current.filter((id) => id !== worker.id))} type="checkbox" value={worker.id} /><span><b>{worker.display_name}</b><span className="block text-xs text-ink-600">{worker.conflict_reason ?? worker.role_label}</span></span></label>)}</div><Label htmlFor="worker-note">기사 전달 메모</Label><Textarea autoComplete="off" id="worker-note" name="workerNote" onChange={(event) => setWorkerNote(event.target.value)} value={workerNote} /><Button className="w-full" disabled={dispatchMutation.isPending || dispatchQuery.data.status === "stale"} onClick={() => dispatchMutation.mutate()} size="cta">배차 확정</Button></div> : null}
          <ApiNotice error={setupMutation.error ?? dispatchMutation.error} title="배차를 처리하지 못했어요" />
        </WorkflowTask>

        <WorkflowTask
          description={completionQuery.data?.completion_submission_id ? "고객 확인 요청과 완료 문서를 처리해요" : "현장기사의 완료 제출을 기다려요"}
          index={4}
          status={completionQuery.data?.archive_ready ? "문서 준비" : completionQuery.data?.completion_submission_id ? "확인 요청" : "대기"}
          title="완료와 문서"
          tone={completionQuery.data?.archive_ready ? "success" : "neutral"}
        >
          <ApiNotice error={completionQuery.error} title="완료 기록이 아직 준비되지 않았어요" />
          {completionQuery.data ? <><div className="mt-4 rounded-xl bg-canvas p-4"><p className="text-sm text-ink-600">완료 기록 금액</p><strong className="text-2xl">{money(completionQuery.data.final_amount_krw)}</strong><p className="mt-2 text-sm text-ink-600">완료 제출: {completionQuery.data.completion_submission_id ? "수신" : "대기"} · 고객 요청: {completionQuery.data.completion_request?.status ?? "전송 전"}</p></div><Button className="mt-4 w-full" disabled={!completionQuery.data.completion_submission_id || completionQuery.data.completion_request?.status === "requested" || completionRequestMutation.isPending} onClick={() => completionRequestMutation.mutate()}><Send aria-hidden="true" /> 고객 완료 확인 요청</Button><Button className="mt-2 w-full" disabled={!completionQuery.data.archive_ready || archiveMutation.isPending} onClick={() => archiveMutation.mutate()} variant="outline">{archiveMutation.isPending ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : <Download aria-hidden="true" />} 문서 ZIP 다운로드</Button></> : <EmptyState>현장기사의 완료 제출을 기다리고 있습니다.</EmptyState>}
          <ApiNotice error={completionRequestMutation.error ?? downloadError} title="완료 요청 또는 문서를 처리하지 못했어요" />
        </WorkflowTask>
      </div>
    </WorkflowShell>
  );
}
