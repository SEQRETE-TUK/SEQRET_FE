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
import { ListGroup, ListRow, SectionHeader, StatusTag } from "@/components/layout/app-primitives";
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

const money = (value: number | null | undefined) => value == null ? "금액 미정" : `${value.toLocaleString("ko-KR")}원`;

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
              <div className="mt-5 grid grid-cols-2 divide-x divide-line rounded-[var(--radius-input)] bg-primary-50 py-4 text-center">
                <div><p className="text-xs font-bold text-primary-700">작업 항목</p><strong className="mt-1 block text-[22px]">{scopeQuery.data.scope.item_count}개</strong></div>
                <div><p className="text-xs font-bold text-primary-700">제안 금액</p><strong className="mt-1 block text-[22px] text-primary-800">{money(scopeQuery.data.quote?.total_amount_krw)}</strong></div>
              </div>

              <div className="mt-5 grid grid-cols-2 border-b border-line" role="tablist" aria-label="작업 범위 보기">
                <button aria-controls="scope-panel" aria-selected={scopeTab === "summary"} className={`relative min-h-12 text-sm font-extrabold ${scopeTab === "summary" ? "text-ink-900 after:absolute after:inset-x-0 after:bottom-[-1px] after:h-0.5 after:bg-primary-600" : "text-ink-600"}`} id="scope-tab-summary" onClick={() => setScopeTab("summary")} role="tab" type="button">변경 요약</button>
                <button aria-controls="scope-panel" aria-selected={scopeTab === "all"} className={`relative min-h-12 text-sm font-extrabold ${scopeTab === "all" ? "text-ink-900 after:absolute after:inset-x-0 after:bottom-[-1px] after:h-0.5 after:bg-primary-600" : "text-ink-600"}`} id="scope-tab-all" onClick={() => setScopeTab("all")} role="tab" type="button">전체 범위</button>
              </div>

              <section aria-labelledby={scopeTab === "summary" ? "scope-tab-summary" : "scope-tab-all"} className="mt-6" id="scope-panel" role="tabpanel">
                <SectionHeader>{scopeTab === "summary" ? "확인할 범위" : "전체 작업 범위"}</SectionHeader>
                <ListGroup variant="plain">
                  {scopeQuery.data.scope.room_groups.map((group) => (
                    <ListRow key={group.room_zone_id} description={group.items.map((item) => item.description).join(" · ")} end={`${group.items.length}개`}>{group.label}</ListRow>
                  ))}
                </ListGroup>
              </section>
            </div>
            {scopeQuery.data.scope.status === "customer_review" ? (
              <SheetFooter className="-mx-5 grid grid-cols-[0.8fr_1.2fr] gap-2">
                <Button disabled={confirmMutation.isPending} onClick={() => setRevisionOpen(true)} variant="outline">수정 요청</Button>
                <Button disabled={confirmMutation.isPending} onClick={() => confirmMutation.mutate()}><Check /> 이대로 확인</Button>
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
            <div className="mt-3 rounded-xl bg-warning-bg p-4"><p className="text-sm text-warning-ink">변경 후 금액</p><strong className="mt-1 block text-2xl text-warning-ink">{money(changeQuery.data.quote.total_amount_krw)}</strong><p className="mt-2 text-xs text-ink-600">현장 증빙 {changeQuery.data.evidence_media.length}건 · URL은 저장하지 않습니다.</p></div>
            {changeQuery.data.status === "pending" ? (
              <>
                <Button className="mt-4 w-full" disabled={changeMutation.isPending} onClick={() => changeMutation.mutate("approve")} size="cta">승인하기</Button>
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
