import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Check, ChevronRight, CircleDollarSign, Clock3 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

export function LiveConsumerWorkflow() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [proposalInput, setProposalInput] = useState(searchParams.get("proposal") ?? "");
  const [revisionReason, setRevisionReason] = useState("");
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
    onSuccess: async () => { setRevisionReason(""); await queryClient.invalidateQueries({ queryKey: workflowKeys.scope(session!.actor.job_id) }); },
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
    <WorkflowShell retryAfter={retryAfter} title="내 이사 진행">
      <InvitationPanel />

      <Card className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div><p className="text-sm font-bold text-primary-700">범위 · 견적</p><h2 className="mt-1 text-xl font-extrabold">작업범위 확인</h2></div>
          {scopeQuery.data ? <span className="rounded-full bg-primary-50 px-3 py-2 text-xs font-bold text-primary-700">{scopeQuery.data.scope.version_label}</span> : null}
        </div>
        {scopeQuery.isLoading ? <EmptyState>최신 범위와 견적을 불러오는 중입니다.</EmptyState> : null}
        <ApiNotice error={scopeQuery.error} />
        {scopeQuery.data ? (
          <>
            <p className="mt-3 text-sm text-ink-600">{scopeQuery.data.job.origin_summary ?? "출발지 미정"} → {scopeQuery.data.job.destination_summary ?? "도착지 미정"}</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-canvas p-4"><p className="text-xs text-ink-600">작업 항목</p><strong className="mt-1 block text-xl">{scopeQuery.data.scope.item_count}개</strong></div>
              <div className="rounded-xl bg-primary-50 p-4"><p className="text-xs text-primary-700">제안 금액</p><strong className="mt-1 block text-xl text-primary-800">{money(scopeQuery.data.quote?.total_amount_krw)}</strong></div>
            </div>
            <div className="mt-4 space-y-2">
              {scopeQuery.data.scope.room_groups.map((group) => <div className="rounded-xl border border-line p-3" key={group.room_zone_id}><b>{group.label}</b><p className="mt-1 text-sm text-ink-600">{group.items.map((item) => item.description).join(" · ")}</p></div>)}
            </div>
            {scopeQuery.data.scope.status === "customer_review" ? (
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button disabled={confirmMutation.isPending} onClick={() => confirmMutation.mutate()}><Check /> 이 범위 확인</Button>
                <Button onClick={() => document.getElementById("revision-reason")?.focus()} variant="outline">수정 요청</Button>
              </div>
            ) : <EmptyState>현재 상태: {scopeQuery.data.scope.status}</EmptyState>}
            <form className="mt-4 space-y-2" onSubmit={(event: FormEvent) => { event.preventDefault(); if (revisionReason.trim()) revisionMutation.mutate(); }}>
              <Label htmlFor="revision-reason">수정 요청 사유</Label>
              <Textarea id="revision-reason" maxLength={2000} onChange={(event) => setRevisionReason(event.target.value)} value={revisionReason} />
              <Button className="w-full" disabled={!revisionReason.trim() || revisionMutation.isPending} type="submit" variant="outline">수정 요청 보내기</Button>
            </form>
          </>
        ) : null}
        <ApiNotice error={confirmMutation.error ?? revisionMutation.error} title="범위 요청을 처리하지 못했어요" />
      </Card>

      <Card className="p-5">
        <p className="text-sm font-bold text-warning-ink">현장 변경</p>
        <h2 className="mt-1 text-xl font-extrabold">변경 제안 확인</h2>
        <form className="mt-4 flex gap-2" onSubmit={(event) => { event.preventDefault(); if (proposalInput.trim()) setSearchParams((current) => { current.set("proposal", proposalInput.trim()); return current; }); }}>
          <Input aria-label="변경 제안 ID" onChange={(event) => setProposalInput(event.target.value)} placeholder="알림에서 받은 제안 ID" value={proposalInput} />
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
            {changeMode ? <div className="mt-4 space-y-2"><Label htmlFor="change-note">{changeMode === "reject" ? "거절 사유" : "설명이 필요한 내용"}</Label><Textarea id="change-note" maxLength={2000} onChange={(event) => setChangeNote(event.target.value)} value={changeNote} /><Button className="w-full" disabled={!changeNote.trim() || changeMutation.isPending} onClick={() => changeMutation.mutate(changeMode)}>{changeMode === "reject" ? "거절 기록" : "설명 요청 보내기"}</Button></div> : null}
          </div>
        ) : null}
        <ApiNotice error={changeMutation.error} title="변경 결정을 처리하지 못했어요" />
      </Card>

      <Card className="p-5">
        <p className="text-sm font-bold text-success-ink">완료</p>
        <h2 className="mt-1 text-xl font-extrabold">작업 완료 확인</h2>
        {completionQuery.isLoading ? <EmptyState>완료 기록을 확인하는 중입니다.</EmptyState> : null}
        <ApiNotice error={completionQuery.error} title="완료 기록이 아직 준비되지 않았어요" />
        {completionQuery.data ? (
          <>
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
            {reportingProblem ? <div className="mt-4 space-y-2"><Label htmlFor="problem-type">문제 유형</Label><select className="h-12 w-full rounded-xl border border-input bg-white px-4" id="problem-type" onChange={(event) => setProblemType(event.target.value as typeof problemType)} value={problemType}><option value="missing_work">작업 누락</option><option value="damage">파손</option><option value="amount">금액</option><option value="other">기타</option></select><Label htmlFor="problem-description">상세 내용</Label><Textarea id="problem-description" maxLength={2000} onChange={(event) => setProblemDescription(event.target.value)} value={problemDescription} /><Button className="w-full" disabled={!problemDescription.trim() || completionMutation.isPending} onClick={() => completionMutation.mutate("report_issue")}>문제 신고 제출 <ChevronRight /></Button></div> : null}
          </>
        ) : null}
        <ApiNotice error={completionMutation.error} title="완료 응답을 처리하지 못했어요" />
      </Card>
    </WorkflowShell>
  );
}
