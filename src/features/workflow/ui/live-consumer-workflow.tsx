import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckIcon as Check,
  CaretRightIcon as ChevronRight,
  CurrencyCircleDollarIcon as CircleDollarSign,
  ClockIcon as Clock3,
} from "@phosphor-icons/react";
import {
  WarningStatusIcon as AlertTriangle,
} from "@/components/icons";
import { useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";

import { mockApiEnabled } from "@/api/mock-api";
import { Button } from "@/components/ui/button";
import {
  ConfirmationStatus,
  HandoffStatus,
  ListGroup,
  ListRow,
  MoneyBreakdown,
  SectionHeader,
  StatusTag,
  WorkContext,
} from "@/components/layout/app-primitives";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { WorkflowTask } from "@/components/workflow/workflow-task";
import { useAuth } from "@/features/auth/model/auth-context";
import {
  confirmScope,
  decideChangeProposal,
  decideCompletion,
  getChangeProposal,
  getCompletionSummary,
  getScopeReview,
  requestScopeRevision,
  shouldRecoverState,
  workflowKeys,
  type Connection,
} from "@/features/workflow/api/workflow-api";
import {
  ApiNotice,
  EmptyState,
  InvitationPanel,
  WorkflowShell,
} from "@/features/workflow/ui/workflow-shell";
import { useAuthFailure } from "@/features/workflow/model/use-auth-failure";
import { useRetryAfter } from "@/features/workflow/model/use-retry-after";

const moneyFormatter = new Intl.NumberFormat("ko-KR");
const money = (value: number | null | undefined) => value == null ? "금액 미정" : `${moneyFormatter.format(value)}원`;

export function LiveConsumerWorkflow({ embedded = false }: { embedded?: boolean }) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [proposalInput, setProposalInput] = useState(searchParams.get("proposal") ?? "");
  const [revisionReason, setRevisionReason] = useState("");
  const [revisionOpen, setRevisionOpen] = useState(false);
  const [scopeTab, setScopeTab] = useState<"summary" | "all">("summary");
  const [changeMode, setChangeMode] = useState<"reject" | "request_clarification" | null>(null);
  const [changeNote, setChangeNote] = useState("");
  const [problemType, setProblemType] = useState<"missing_work" | "damage" | "amount" | "other">("missing_work");
  const [problemDescription, setProblemDescription] = useState("");
  const [reportingProblem, setReportingProblem] = useState(false);
  const [extraCharge, setExtraCharge] = useState<boolean | null>(null);
  const proposalId = searchParams.get("proposal") ?? "";
  const connection: Connection | null = session ? { accessToken: session.accessToken, jobId: session.actor.job_id } : null;

  const scopeQuery = useQuery({
    enabled: Boolean(connection),
    queryKey: workflowKeys.scope(session?.actor.job_id ?? ""),
    queryFn: () => getScopeReview(connection!),
  });
  const changeQuery = useQuery({
    enabled: Boolean(connection && proposalId),
    queryKey: workflowKeys.proposal(session?.actor.job_id ?? "", proposalId),
    queryFn: () => getChangeProposal(connection!, proposalId),
  });
  const completionQuery = useQuery({
    enabled: Boolean(connection),
    queryKey: workflowKeys.completion(session?.actor.job_id ?? ""),
    queryFn: () => getCompletionSummary(connection!),
  });

  const refreshScopeOnConflict = async (error: unknown) => {
    if (shouldRecoverState(error) && session) await queryClient.invalidateQueries({ queryKey: workflowKeys.scope(session.actor.job_id) });
  };
  const confirmMutation = useMutation({
    mutationFn: () => confirmScope(connection!, scopeQuery.data!.scope.id),
    onError: refreshScopeOnConflict,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: workflowKeys.scope(session!.actor.job_id) }),
  });
  const revisionMutation = useMutation({
    mutationFn: () => requestScopeRevision(connection!, scopeQuery.data!.scope.id, revisionReason.trim()),
    onError: refreshScopeOnConflict,
    onSuccess: async () => { setRevisionReason(""); setRevisionOpen(false); await queryClient.invalidateQueries({ queryKey: workflowKeys.scope(session!.actor.job_id) }); },
  });
  const changeMutation = useMutation({
    mutationFn: (decision: "approve" | "reject" | "request_clarification") => decideChangeProposal(connection!, proposalId, {
      decision,
      ...(decision === "approve" ? {} : { note: changeNote.trim() }),
    }),
    onError: async (error) => {
      if (shouldRecoverState(error)) await queryClient.invalidateQueries({ queryKey: workflowKeys.proposal(session!.actor.job_id, proposalId) });
    },
    onSuccess: async () => {
      setChangeMode(null);
      setChangeNote("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: workflowKeys.proposal(session!.actor.job_id, proposalId) }),
        queryClient.invalidateQueries({ queryKey: workflowKeys.scope(session!.actor.job_id) }),
      ]);
    },
  });
  const completionMutation = useMutation({
    mutationFn: (decision: "confirm" | "report_issue") => decideCompletion(
      connection!,
      completionQuery.data!.completion_request!.completion_request_id,
      decision === "confirm"
        ? { decision, unrecorded_extra_charge: extraCharge }
        : { decision, problem_type: problemType, problem_description: problemDescription.trim(), unrecorded_extra_charge: extraCharge },
    ),
    onError: async (error) => {
      if (shouldRecoverState(error)) await queryClient.invalidateQueries({ queryKey: workflowKeys.completion(session!.actor.job_id) });
    },
    onSuccess: async () => {
      setReportingProblem(false);
      setProblemDescription("");
      await queryClient.invalidateQueries({ queryKey: workflowKeys.completion(session!.actor.job_id) });
    },
  });

  const mutationError = confirmMutation.error ?? revisionMutation.error ?? changeMutation.error ?? completionMutation.error;
  const retryAfter = useRetryAfter(mutationError);
  useAuthFailure(scopeQuery.error, changeQuery.error, completionQuery.error, mutationError);
  if (!connection || session?.actor.role !== "customer") return null;

  const completionRequest = completionQuery.data?.completion_request;
  const canDecideCompletion = completionRequest?.status === "requested";
  return (
    <WorkflowShell
      context={scopeQuery.data ? (
        <WorkContext
          code={scopeQuery.data.job.job_code}
          route={`${scopeQuery.data.job.origin_summary ?? "출발지 미정"} → ${scopeQuery.data.job.destination_summary ?? "도착지 미정"}`}
          scheduledAt={scopeQuery.data.job.scheduled_at}
          status={<StatusTag tone={scopeQuery.data.scope.status === "confirmed" ? "success" : "warning"}>{scopeQuery.data.scope.status === "customer_review" ? "내 확인 대기" : scopeQuery.data.scope.status === "revision_requested" ? "업체 수정 중" : scopeQuery.data.scope.status === "confirmed" ? "공동확인 완료" : "업체 검토 중"}</StatusTag>}
          title={scopeQuery.data.job.title}
          version={scopeQuery.data.scope.version_label}
        />
      ) : undefined}
      currentStep={scopeQuery.data?.scope.status === "customer_review" ? 1 : canDecideCompletion ? 4 : proposalId ? 2 : 1}
      embedded={embedded}
      retryAfter={retryAfter}
      summary="범위 확인, 현장 변경 승인, 완료 확인이 필요한 순간만 작업으로 표시됩니다."
      title="내 이사 진행"
    >
      <InvitationPanel />

      <div className="workflow-task-list mt-3 overflow-hidden rounded-[var(--radius-input)] border border-line bg-surface">
      <WorkflowTask
        defaultOpen={searchParams.get("task") === "scope"}
        description={scopeQuery.data ? `${scopeQuery.data.scope.item_count}개 항목 · ${money(scopeQuery.data.quote?.total_amount_krw)}` : "업체가 보낸 최신 작업범위와 금액을 확인해요"}
        detailTitle="작업 범위 확인"
        index={1}
        status={scopeQuery.isLoading ? "불러오는 중" : scopeQuery.data?.scope.status === "customer_review" ? "확인 필요" : "상태 확인"}
        title="범위와 견적"
        tone={scopeQuery.data?.scope.status === "customer_review" ? "primary" : "neutral"}
      >
        {scopeQuery.isLoading ? <EmptyState>최신 범위와 견적을 불러오는 중입니다.</EmptyState> : null}
        <ApiNotice error={scopeQuery.error} />
        {scopeQuery.data ? (
          <>
            <div className="pt-5">
              <div className="flex items-center justify-between gap-3">
                <StatusTag tone={scopeQuery.data.scope.status === "customer_review" ? "primary" : "success"}>{scopeQuery.data.scope.status === "customer_review" ? "공동확인 대기" : "확인된 기준"}</StatusTag>
                <span className="text-sm font-bold text-ink-600">버전 {scopeQuery.data.scope.version_label}</span>
              </div>
              <p className="mt-5 text-[17px] leading-6 font-extrabold">{scopeQuery.data.job.origin_summary ?? "출발지 미정"} → {scopeQuery.data.job.destination_summary ?? "도착지 미정"}</p>
              <HandoffStatus
                action={scopeQuery.data.scope.status === "customer_review" ? "제안 내용을 검토해 주세요" : scopeQuery.data.scope.status === "revision_requested" ? "업체의 새 제안을 기다리고 있어요" : "최신 기준을 함께 확인했어요"}
                actor={scopeQuery.data.scope.status === "customer_review" ? "고객" : scopeQuery.data.scope.status === "revision_requested" ? "업체" : "고객·업체"}
                updatedAt={scopeQuery.data.revision_request?.requested_at ?? scopeQuery.data.company_confirmed_at}
              >
                {scopeQuery.data.scope.status === "customer_review"
                  ? "확인은 결제나 전자서명이 아니며, 수정 요청을 보내면 이 버전은 그대로 남고 업체가 새 버전을 제안합니다."
                  : scopeQuery.data.scope.status === "revision_requested"
                    ? "작성한 수정 사유는 보존됐습니다. 새 제안이 오기 전까지 기존 기준과 금액은 바뀌지 않습니다."
                    : "새 제안이 생기면 양측은 새 버전을 다시 확인합니다."}
              </HandoffStatus>
              <div className="mt-5 grid grid-cols-2 divide-x divide-line rounded-[var(--radius-input)] bg-primary-50 py-4 text-center">
                <div><p className="text-xs font-bold text-primary-700">작업 항목</p><strong className="mt-1 block text-[22px]">{scopeQuery.data.scope.item_count}개</strong></div>
                <div><p className="text-xs font-bold text-primary-700">제안 금액</p><strong className="mt-1 block text-[22px] text-primary-800">{money(scopeQuery.data.quote?.total_amount_krw)}</strong></div>
              </div>

              <div className="mt-5 grid grid-cols-2 border-b border-line" role="tablist" aria-label="작업 범위 보기">
                <button aria-controls="scope-panel" aria-selected={scopeTab === "summary"} className={`relative min-h-12 text-sm font-extrabold ${scopeTab === "summary" ? "text-ink-900 after:absolute after:inset-x-0 after:bottom-[-1px] after:h-0.5 after:bg-primary-600" : "text-ink-600"}`} id="scope-tab-summary" onClick={() => setScopeTab("summary")} role="tab" type="button">제안 요약</button>
                <button aria-controls="scope-panel" aria-selected={scopeTab === "all"} className={`relative min-h-12 text-sm font-extrabold ${scopeTab === "all" ? "text-ink-900 after:absolute after:inset-x-0 after:bottom-[-1px] after:h-0.5 after:bg-primary-600" : "text-ink-600"}`} id="scope-tab-all" onClick={() => setScopeTab("all")} role="tab" type="button">작업 범위</button>
              </div>

              <section aria-labelledby={scopeTab === "summary" ? "scope-tab-summary" : "scope-tab-all"} className="mt-6" id="scope-panel" role="tabpanel">
                {scopeTab === "summary" ? (
                  <>
                    <SectionHeader>업체 제안</SectionHeader>
                    <p className="mt-2 text-sm leading-6 text-ink-600">{scopeQuery.data.proposal_reason ?? "제안 사유가 등록되지 않았습니다."}</p>
                    <div className="mt-6">
                      <SectionHeader>금액 구성</SectionHeader>
                      {scopeQuery.data.quote ? <MoneyBreakdown adjustments={scopeQuery.data.quote.adjustments.map(({ amount_krw, label }) => ({ amount: amount_krw, label }))} baseAmount={scopeQuery.data.quote.base_amount_krw} totalAmount={scopeQuery.data.quote.total_amount_krw} /> : <EmptyState>업체가 금액을 제안하면 여기에 구성 내역이 표시됩니다.</EmptyState>}
                    </div>
                    <div className="mt-6">
                      <SectionHeader>양측 확인</SectionHeader>
                      <ConfirmationStatus companyConfirmedAt={scopeQuery.data.company_confirmed_at} customerConfirmedAt={scopeQuery.data.customer_confirmed_at} />
                    </div>
                  </>
                ) : (
                  <>
                    <SectionHeader>공간별 작업</SectionHeader>
                    <ListGroup variant="plain">
                      {scopeQuery.data.scope.room_groups.map((group) => (
                        <ListRow key={group.room_zone_id} description={group.items.map((item) => item.description).join(" · ")} end={`${group.items.length}개`}>{group.label}</ListRow>
                      ))}
                    </ListGroup>
                    <div className="mt-6">
                      <SectionHeader>포함 작업</SectionHeader>
                      <ListGroup variant="plain">
                        {scopeQuery.data.scope.included_works.length > 0 ? scopeQuery.data.scope.included_works.map((work) => <ListRow key={work}>{work}</ListRow>) : <ListRow>등록된 포함 작업 없음</ListRow>}
                      </ListGroup>
                    </div>
                    <div className="mt-6">
                      <SectionHeader>제외 작업</SectionHeader>
                      <ListGroup variant="plain">
                        {scopeQuery.data.scope.exclusions.length > 0 ? scopeQuery.data.scope.exclusions.map((work) => <ListRow key={work}>{work}</ListRow>) : <ListRow>등록된 제외 작업 없음</ListRow>}
                      </ListGroup>
                    </div>
                  </>
                )}
              </section>
            </div>
            {scopeQuery.data.scope.status === "customer_review" ? (
              <SheetFooter className="-mx-5 grid grid-cols-[0.8fr_1.2fr] gap-2">
                <Button disabled={confirmMutation.isPending} onClick={() => setRevisionOpen(true)} variant="outline">수정 요청</Button>
                <Button disabled={confirmMutation.isPending} onClick={() => confirmMutation.mutate()}><Check /> 범위 확인 완료</Button>
              </SheetFooter>
            ) : <div className="px-5 pb-5"><EmptyState>현재 상태: {scopeQuery.data.scope.status}</EmptyState></div>}
          </>
        ) : null}
        <ApiNotice error={confirmMutation.error ?? revisionMutation.error} title="범위 요청을 처리하지 못했어요" />
      </WorkflowTask>

      <Sheet onOpenChange={setRevisionOpen} open={revisionOpen}>
        <SheetContent>
          <form onSubmit={(event: FormEvent) => { event.preventDefault(); if (revisionReason.trim()) revisionMutation.mutate(); }}>
            <SheetHeader>
              <SheetTitle>수정 요청</SheetTitle>
              <SheetDescription>업체가 바로 고칠 수 있도록 빠진 짐이나 잘못된 작업 범위를 구체적으로 적어주세요.</SheetDescription>
            </SheetHeader>
            <div className="px-5 py-2">
              <Label htmlFor="revision-reason">수정이 필요한 내용</Label>
              <Textarea autoComplete="off" className="mt-2 min-h-32" id="revision-reason" maxLength={2000} name="revisionReason" onChange={(event) => setRevisionReason(event.target.value)} placeholder="예: 거실 목록에 4인용 식탁이 빠졌어요…" value={revisionReason} />
              <p className="mt-2 text-right text-xs text-ink-400">{revisionReason.length}/2,000</p>
            </div>
            <SheetFooter>
              <Button className="w-full" disabled={!revisionReason.trim() || revisionMutation.isPending} size="cta" type="submit">수정 요청 보내기</Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <WorkflowTask
        description={proposalId ? "알림으로 받은 변경 제안의 근거와 금액을 확인해요" : "변경 요청이 생기면 알림의 제안 ID로 열 수 있어요"}
        index={2}
        status={changeQuery.data?.status === "pending" ? "결정 필요" : proposalId ? "조회 중" : "대기"}
        title="현장 변경"
        tone={changeQuery.data?.status === "pending" ? "warning" : "neutral"}
      >
        <form className="mt-4 flex gap-2" onSubmit={(event) => { event.preventDefault(); if (proposalInput.trim()) setSearchParams((current) => { current.set("proposal", proposalInput.trim()); return current; }); }}>
          <Input aria-label="변경 제안 ID" autoCapitalize="none" autoComplete="off" name="proposalId" onChange={(event) => setProposalInput(event.target.value)} placeholder="알림에서 받은 제안 ID…" spellCheck={false} value={proposalInput} />
          <Button type="submit" variant="outline">열기</Button>
        </form>
        {proposalId && changeQuery.isLoading ? <EmptyState>변경 제안을 불러오는 중입니다.</EmptyState> : null}
        <ApiNotice error={changeQuery.error} title="변경 제안을 불러오지 못했어요" />
        {changeQuery.data ? (
          <div className="mt-4">
            <h3 className="text-lg font-bold">{changeQuery.data.title}</h3>
            <p className="mt-1 text-sm leading-6 text-ink-600">{changeQuery.data.reason}</p>
            <HandoffStatus action="현장 변경안을 결정해 주세요" actor="고객" updatedAt={changeQuery.data.requested_at}>설명 요청이나 거절은 기존 승인본과 금액을 바꾸지 않습니다. 승인한 경우에만 새 버전과 총액이 만들어집니다.</HandoffStatus>
            <p className="mt-5 text-xs font-bold text-ink-600">기준 범위 {changeQuery.data.base_scope_version_label}</p>
            <MoneyBreakdown adjustments={changeQuery.data.quote.adjustments.map(({ amount_krw, label }) => ({ amount: amount_krw, label }))} baseAmount={changeQuery.data.quote.base_amount_krw} totalAmount={changeQuery.data.quote.total_amount_krw} />
            <p className="mt-3 text-xs text-ink-600">현장 증빙 {changeQuery.data.evidence_media.length}건 · URL은 저장하지 않습니다.</p>
            {changeQuery.data.evidence_media.length > 0 ? <div className="mt-3 grid grid-cols-2 gap-2">{changeQuery.data.evidence_media.map((media) => <img alt="현장 변경 근거" className="aspect-[4/3] w-full rounded-[var(--radius-input)] object-cover" height="120" key={media.media_asset_id} loading="lazy" src={media.read_url} width="160" />)}</div> : null}
            {changeQuery.data.status === "pending" ? (
              <>
                <Button className="mt-4 w-full" disabled={changeMutation.isPending} onClick={() => changeMutation.mutate("approve")} size="cta">변경안 승인</Button>
                <div className="mt-2 grid grid-cols-2 gap-2"><Button onClick={() => setChangeMode("request_clarification")} variant="outline">설명 요청</Button><Button onClick={() => setChangeMode("reject")} variant="destructive">거절</Button></div>
              </>
            ) : <EmptyState>처리 상태: {changeQuery.data.status}</EmptyState>}
            {changeMode ? <div className="mt-4 space-y-2"><Label htmlFor="change-note">{changeMode === "reject" ? "거절 사유" : "설명이 필요한 내용"}</Label><Textarea autoComplete="off" id="change-note" maxLength={2000} name="changeNote" onChange={(event) => setChangeNote(event.target.value)} value={changeNote} /><Button className="w-full" disabled={!changeNote.trim() || changeMutation.isPending} onClick={() => changeMutation.mutate(changeMode)}>{changeMode === "reject" ? "거절 기록" : "설명 요청 보내기"}</Button></div> : null}
          </div>
        ) : null}
        <ApiNotice error={changeMutation.error} title="변경 결정을 처리하지 못했어요" />
      </WorkflowTask>

      <WorkflowTask
        defaultOpen={searchParams.get("task") === "completion"}
        description={canDecideCompletion ? "최종 금액과 완료 기록을 확인하고 응답해요" : "현장기사의 완료 제출과 업체 요청을 기다려요"}
        index={3}
        status={canDecideCompletion ? "확인 필요" : "대기"}
        title="완료 확인"
        tone={canDecideCompletion ? "success" : "neutral"}
      >
        {completionQuery.isLoading ? <EmptyState>완료 기록을 확인하는 중입니다.</EmptyState> : null}
        <ApiNotice error={completionQuery.error} title="완료 기록이 아직 준비되지 않았어요" />
        {completionQuery.data ? (
          <>
            {canDecideCompletion ? <HandoffStatus action="완료 기록과 최종 금액을 확인해 주세요" actor="고객" updatedAt={completionRequest?.requested_at}>문제가 있다면 완료 확인 대신 사실을 기록할 수 있습니다. 문제 신고는 책임 판정이 아닙니다.</HandoffStatus> : null}
            {mockApiEnabled && completionQuery.data.completion_media_count > 0 ? (
              <figure className="mt-4">
                <div className="grid grid-cols-2 overflow-hidden rounded-[var(--radius-input)] border border-line bg-canvas">
                  <span className="relative border-r border-line">
                    <img alt="거실 작업 전" className="h-28 w-full object-cover" height="112" loading="lazy" src="/built-in-wardrobe-evidence.png" width="176" />
                    <span className="absolute top-2 left-2 rounded-md bg-ink-900/75 px-2 py-1 text-[11px] font-bold text-white">작업 전</span>
                  </span>
                  <span className="relative">
                    <img alt="거실 작업 후" className="h-28 w-full object-cover" height="112" loading="lazy" src="/room-after-evidence.png" width="176" />
                    <span className="absolute top-2 left-2 rounded-md bg-ink-900/75 px-2 py-1 text-[11px] font-bold text-white">작업 후</span>
                  </span>
                </div>
                <figcaption className="mt-2 text-sm leading-5 text-ink-600">현장에서 제출한 완료 사진 {completionQuery.data.completion_media_count}장 중 대표 기록입니다.</figcaption>
              </figure>
            ) : null}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-canvas p-4"><CircleDollarSign className="text-primary-700" /><p className="mt-2 text-xs text-ink-600">최종 금액</p><strong>{money(completionQuery.data.final_amount_krw)}</strong></div>
              <div className="rounded-xl bg-canvas p-4"><Clock3 className="text-primary-700" /><p className="mt-2 text-xs text-ink-600">작업시간</p><strong>{completionQuery.data.duration_minutes ?? 0}분</strong></div>
            </div>
            <p className="mt-3 text-sm text-ink-600">체크리스트 {completionQuery.data.checklist.completed_count}/{completionQuery.data.checklist.total_count} · 완료 사진 {completionQuery.data.completion_media_count}장</p>
            {completionQuery.data.quote ? <div className="mt-6"><SectionHeader>최종 금액 구성</SectionHeader><MoneyBreakdown adjustments={[
              ...completionQuery.data.quote.adjustments.map(({ amount_krw, label }) => ({ amount: amount_krw, label })),
              ...completionQuery.data.field_changes.filter(({ status }) => status === "approved").map(({ amount_delta_krw, title }) => ({ amount: amount_delta_krw, label: title })),
            ]} baseAmount={completionQuery.data.quote.base_amount_krw} totalAmount={completionQuery.data.final_amount_krw ?? completionQuery.data.quote.total_amount_krw} /></div> : null}
            <div className="mt-4 grid grid-cols-2 gap-2"><Button onClick={() => setExtraCharge(false)} variant={extraCharge === false ? "default" : "outline"}>추가금 없음</Button><Button onClick={() => setExtraCharge(true)} variant={extraCharge === true ? "default" : "outline"}>추가금 있었음</Button></div>
            {canDecideCompletion ? (
              <>
                <Button className="mt-4 w-full" disabled={completionMutation.isPending} onClick={() => completionMutation.mutate("confirm")} size="cta"><Check /> 완료 확인</Button>
                <Button className="mt-2 w-full" onClick={() => setReportingProblem((current) => !current)} variant="destructive"><AlertTriangle /> 문제 신고</Button>
              </>
            ) : <EmptyState>완료 요청 상태: {completionRequest?.status ?? "요청 전"}</EmptyState>}
            {reportingProblem ? <div className="mt-4 space-y-2"><Label htmlFor="problem-type">문제 유형</Label><Select autoComplete="off" id="problem-type" name="problemType" onChange={(event) => setProblemType(event.target.value as typeof problemType)} value={problemType}><option value="missing_work">작업 누락</option><option value="damage">파손</option><option value="amount">금액</option><option value="other">기타</option></Select><Label htmlFor="problem-description">상세 내용</Label><Textarea autoComplete="off" id="problem-description" maxLength={2000} name="problemDescription" onChange={(event) => setProblemDescription(event.target.value)} value={problemDescription} /><Button className="w-full" disabled={!problemDescription.trim() || completionMutation.isPending} onClick={() => completionMutation.mutate("report_issue")}>문제 신고 제출 <ChevronRight /></Button></div> : null}
          </>
        ) : null}
        <ApiNotice error={completionMutation.error} title="완료 응답을 처리하지 못했어요" />
      </WorkflowTask>
      </div>
    </WorkflowShell>
  );
}
