import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PaperPlaneTiltIcon as Send } from "@phosphor-icons/react";
import { useState } from "react";

import { ListGroup, ListRow, StatusTag } from "@/components/layout/app-primitives";
import { Button } from "@/components/ui/button";
import { ErrorToast } from "@/components/ui/error-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  apiErrorMessage,
  createChangeProposal,
  explainChangeProposal,
  getChangeProposal,
  scopeContentFromReviewWithChange,
  workflowKeys,
  type Connection,
  type FieldIssue,
  type ScopeReview,
} from "@/features/workflow/api/workflow-api";

const moneyFormatter = new Intl.NumberFormat("ko-KR");
const money = (amount: number | null | undefined) => amount == null ? "–" : `${moneyFormatter.format(amount)}원`;
const issueStatusLabel = (status: FieldIssue["status"]) => ({ open: "처리 필요", customer_review: "고객 확인 중", clarification_requested: "설명 필요", approved: "승인 완료", rejected: "반영 안 함" })[status];

export function ProviderIssueWorkbench({ connection, issues, scope }: { connection: Connection; issues: FieldIssue[]; scope: ScopeReview | undefined }) {
  const [selectedId, setSelectedId] = useState(issues[0]?.field_issue_id ?? "");
  const selected = issues.find((issue) => issue.field_issue_id === selectedId) ?? issues[0];
  const actionableCount = issues.filter((issue) => issue.status === "open" || issue.status === "clarification_requested").length;
  const tone = (issue: FieldIssue): "success" | "neutral" | "warning" => issue.status === "approved" ? "success" : issue.status === "rejected" ? "neutral" : "warning";

  return <section className="ui-card ui-card-outlined overflow-hidden xl:grid xl:grid-cols-[minmax(18rem,0.72fr)_minmax(0,1.28fr)]">
    <section aria-labelledby="provider-issue-list-title" className="min-w-0 border-b border-line xl:border-b-0 xl:border-r">
      <div className="flex flex-wrap items-end justify-between gap-2 px-4 py-4">
        <div><h3 className="text-ui-component" id="provider-issue-list-title">현장 보고</h3><p className="mt-1 text-ui-data text-ink-600">전체 {issues.length}건</p></div>
        <StatusTag tone={actionableCount > 0 ? "warning" : "neutral"}>처리 필요 {actionableCount}</StatusTag>
      </div>
      {issues.length ? <ListGroup className="mt-0 border-t border-line" label="현장 보고 목록" variant="plain">
        {issues.map((issue) => <ListRow
          description={scope?.job.customer_display_name ?? "고객"}
          end={<StatusTag tone={tone(issue)}>{issueStatusLabel(issue.status)}</StatusTag>}
          key={issue.field_issue_id}
          onClick={() => setSelectedId(issue.field_issue_id)}
          selected={selected?.field_issue_id === issue.field_issue_id}
        >
          <span className="line-clamp-2 break-words">{issue.title}</span>
        </ListRow>)}
      </ListGroup> : <p className="border-t border-line px-5 py-10 text-center text-ui-support text-ink-600">접수된 현장 보고가 없습니다.</p>}
    </section>
    <section aria-label="선택 현장 보고 상세" className="min-w-0 p-5 sm:p-6">{selected && scope ? <IssueDetail key={selected.field_issue_id} connection={connection} issue={selected} scope={scope} /> : <p className="text-ui-support text-ink-600">처리할 현장 보고가 없습니다.</p>}</section>
  </section>;
}
function IssueDetail({ connection, issue, scope }: { connection: Connection; issue: FieldIssue; scope: ScopeReview }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(issue.title);
  const [adjustment, setAdjustment] = useState(0);
  const [reason, setReason] = useState(issue.description);
  const [explanation, setExplanation] = useState("");
  const proposalQuery = useQuery({ enabled: Boolean(issue.change_proposal_id), queryKey: workflowKeys.proposal(connection.jobId, issue.change_proposal_id ?? "none"), queryFn: () => getChangeProposal(connection, issue.change_proposal_id!) });
  const proposal = proposalQuery.data;
  const evidence = proposal?.evidence_media.length ? proposal.evidence_media : scope.media_previews.filter((asset) => issue.evidence_media_asset_ids.includes(asset.media_asset_id));
  const createMutation = useMutation({
    mutationFn: () => createChangeProposal(connection, {
      field_issue_id: issue.field_issue_id,
      base_scope_version_id: issue.base_scope_version_id,
      title: title.trim(),
      reason: reason.trim(),
      proposed_content: scopeContentFromReviewWithChange(scope, title),
      quote: {
        base_amount_krw: scope.quote?.base_amount_krw ?? 0,
        adjustments: [
          ...(scope.quote?.adjustments ?? []),
          {
            label: `${title.trim().slice(0, 170)} · ${issue.field_issue_id.slice(0, 8)}`,
            amount_krw: adjustment,
          },
        ],
        total_amount_krw: (scope.quote?.total_amount_krw ?? 0) + adjustment,
      },
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: workflowKeys.root(connection.jobId) }),
  });
  const explanationMutation = useMutation({ mutationFn: () => explainChangeProposal(connection, issue.change_proposal_id!, explanation.trim()), onSuccess: async () => { setExplanation(""); await queryClient.invalidateQueries({ queryKey: workflowKeys.proposal(connection.jobId, issue.change_proposal_id!) }); await queryClient.invalidateQueries({ queryKey: workflowKeys.fieldIssues(connection.jobId) }); } });
  const resultingAmount = proposal?.quote.total_amount_krw ?? (scope.quote?.total_amount_krw ?? 0) + adjustment;

  return <>
    <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="text-ui-data text-primary-700">기준 승인본 {proposal?.base_scope_version_label ?? scope.scope.version_label}</p><h3 className="mt-1 break-words text-ui-section">{issue.title}</h3></div><StatusTag tone={issue.status === "approved" ? "success" : issue.status === "rejected" ? "neutral" : "warning"}>{issueStatusLabel(issue.status)}</StatusTag></div>
    <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <div>
        <p className="text-sm font-extrabold">현장 증거</p>
        {evidence.length ? <div className="mt-3 grid gap-2 sm:grid-cols-2">{evidence.map((asset, index) => asset.content_type.startsWith("image/") ? <img alt={`${issue.title} 현장 증거 ${index + 1}`} className="aspect-[16/10] w-full rounded-[var(--radius-component)] object-cover" height="400" key={asset.media_asset_id} loading="lazy" src={asset.read_url} width="640" /> : <video className="aspect-[16/10] w-full rounded-[var(--radius-component)] bg-ink-900 object-cover" controls key={asset.media_asset_id} src={asset.read_url} />)}</div> : <div className="mt-3 grid aspect-[16/9] place-items-center rounded-[var(--radius-component)] bg-surface-muted px-5 text-center text-ui-support text-ink-600">증거 {issue.evidence_media_asset_ids.length}건이 연결됐지만 미리보기가 만료됐거나 아직 준비되지 않았습니다.</div>}
        <p className="mt-5 text-ui-control">기사 설명</p><p className="mt-2 break-words border-y border-line py-3 text-ui-support text-ink-600">{issue.description}</p>
        <h4 className="mt-5 text-ui-control">기준 승인 범위</h4><dl className="mt-2 divide-y divide-line border-y border-line text-ui-support"><div className="flex justify-between gap-3 py-2.5"><dt>포함 작업</dt><dd>{scope.scope.included_works.length}건</dd></div><div className="flex justify-between gap-3 py-2.5"><dt>제외 작업</dt><dd>{scope.scope.exclusions.length}건</dd></div><div className="flex justify-between gap-3 py-2.5"><dt>기준 금액</dt><dd>{money(scope.quote?.total_amount_krw)}</dd></div></dl>
      </div>
      <div>
        <p className="text-ui-control text-primary-700">변경 제안</p>
        {issue.status === "open" ? <>
          <Label className="mt-4 block" htmlFor="change-title">변경 작업</Label><Input className="mt-2" id="change-title" maxLength={100} onChange={(event) => setTitle(event.target.value)} value={title} />
          <Label className="mt-4 block" htmlFor="change-reason">고객에게 보일 사유</Label><Textarea className="mt-2 min-h-28" id="change-reason" maxLength={2000} onChange={(event) => setReason(event.target.value)} value={reason} />
          <div className="mt-5 space-y-3 text-sm"><p className="flex justify-between"><span>기존 금액 ({scope.scope.version_label})</span><strong>{money(scope.quote?.total_amount_krw)}</strong></p><MoneyInput label="추가/조정 금액" onChange={setAdjustment} value={adjustment} /><p className="flex items-center justify-between border-t border-line pt-4"><span className="font-extrabold">변경 후 금액</span><strong className="text-2xl text-primary-700">{money(resultingAmount)}</strong></p></div>
          {createMutation.error ? <ErrorToast message={apiErrorMessage(createMutation.error)} /> : null}
          <Button className="mt-5 w-full" disabled={!title.trim() || !reason.trim() || resultingAmount < 0 || createMutation.isPending} onClick={() => createMutation.mutate()} size="cta"><Send aria-hidden="true" /> 고객에게 변경안 보내기</Button>
        </> : <div className="mt-4 space-y-4">
          <div className="border-y border-line py-4"><p className="text-ui-data text-ink-600">제안 작업</p><p className="mt-1 break-words text-ui-control">{proposal?.title ?? issue.title}</p><p className="mt-3 break-words text-ui-support text-ink-600">{proposal?.reason ?? "제안 내용을 불러오는 중…"}</p><p className="mt-4 flex justify-between gap-3 border-t border-line pt-4 text-ui-support"><span>변경 후 금액</span><strong className="text-primary-700">{money(resultingAmount)}</strong></p></div>
          {issue.status === "clarification_requested" ? <div className="rounded-xl border border-warning bg-warning-bg p-4"><p className="font-extrabold text-warning-ink">고객 설명 요청</p><p className="mt-2 text-sm leading-6 text-ink-600">{proposal?.clarification_note ?? "추가 설명을 입력해 주세요."}</p><Label className="mt-4 block" htmlFor="change-explanation">업체 답변</Label><Textarea className="mt-2 bg-surface" id="change-explanation" maxLength={2000} onChange={(event) => setExplanation(event.target.value)} value={explanation} /><Button className="mt-3 w-full" disabled={!explanation.trim() || explanationMutation.isPending} onClick={() => explanationMutation.mutate()}>설명 제출</Button></div> : null}
          {issue.status === "customer_review" ? <p className="rounded-xl bg-primary-50 p-4 text-sm font-bold text-primary-800">변경안이 전달됐습니다. 고객의 승인·거절·설명 요청을 기다립니다.</p> : null}
          {issue.status === "approved" ? <p className="rounded-xl bg-success-bg p-4 text-sm font-bold text-success-ink">고객 승인으로 새 실행 기준에 반영됐습니다.</p> : null}
          {issue.status === "rejected" ? <p className="rounded-xl bg-surface-muted p-4 text-sm font-bold text-ink-600">고객이 변경안을 승인하지 않았습니다. 기존 승인 범위를 유지합니다.</p> : null}
          {proposalQuery.error ? <p className="text-ui-support text-danger-ink" role="alert">{apiErrorMessage(proposalQuery.error)}</p> : null}
          {explanationMutation.error ? <ErrorToast message={apiErrorMessage(explanationMutation.error)} /> : null}
        </div>}
      </div>
    </div>
  </>;
}

function MoneyInput({ label, onChange, value }: { label: string; onChange: (value: number) => void; value: number }) { return <label className="grid grid-cols-[minmax(0,1fr)_minmax(6rem,7.5rem)_auto] items-center gap-2 text-sm"><span className="text-ink-600">{label}</span><Input className="h-10 text-right tabular-nums" onChange={(event) => onChange(Number(event.target.value))} type="number" value={value} /><span>원</span></label>; }
