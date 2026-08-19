import { CaretDownIcon as CaretDown } from "@phosphor-icons/react";

import { MobilePageHeader } from "@/components/layout/mobile-app-shell";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import type { FieldIssue, ScopeLocationConditions, ScopeReview } from "@/features/workflow/api/workflow-api";

const money = (value: number | null | undefined) => value == null ? "금액 확인 중" : `${new Intl.NumberFormat("ko-KR").format(value)}원`;
const fullDateFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "short",
  hour: "numeric",
  minute: "2-digit",
});

export function AgreementHistorySheet({ issue, onOpenChange, open, presentation = "page", scope }: {
  fallbackLocationConditions?: ScopeLocationConditions[];
  issue?: FieldIssue;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  presentation?: "dialog" | "page";
  scope: ScopeReview;
}) {
  const adjustments = scope.quote?.adjustments ?? [];
  const reportDate = issue?.reported_at ? fullDateFormatter.format(new Date(issue.reported_at)) : null;
  const handleOpenChange = (next: boolean) => onOpenChange(next);

  const content = <>
    {presentation === "dialog" ? <div className="flex min-h-16 items-center border-b border-line px-6 pr-16"><DialogTitle>변경 이력</DialogTitle></div> : <MobilePageHeader onBack={() => handleOpenChange(false)} title="변경 이력" />}
          <div className="px-5 py-6">
            <ol className="relative ml-3 border-l-2 border-line pl-7">
              <li className="relative pb-8">
                <span aria-hidden="true" className="absolute top-0 -left-[37px] size-4 rounded-full border-[3px] border-success bg-surface" />
                <div className="flex min-h-11 items-start justify-between gap-3">
                  <span><span className="inline-flex rounded-md border border-success px-2 py-0.5 text-ui-micro !font-extrabold text-success">현재 버전</span><strong className="mt-2 block text-ui-section">{scope.scope.version_label} · 현재 확인서</strong></span>
                </div>
                <div className="mt-3 ui-card p-4 text-sm"><p>짐 {scope.scope.item_count}개 · 작업 {scope.scope.work_count}개</p><p className="mt-3 border-t border-line pt-3 tabular-nums">금액 <strong className="float-right text-primary-700">{money(scope.quote?.total_amount_krw)}</strong></p>{adjustments.length ? <p className="mt-3 text-ink-600">변경 사유: {adjustments.map((item) => item.label).join(" · ")}</p> : null}<div className="mt-3 flex flex-wrap gap-2"><span className="rounded-md bg-success-bg px-2 py-1 text-ui-control text-success-ink">업체 확인</span><span className={`rounded-md px-2 py-1 text-ui-control ${scope.customer_confirmed_at ? "bg-success-bg text-success-ink" : "bg-warning-bg text-warning-ink"}`}>{scope.customer_confirmed_at ? "고객 확인" : "고객 확인 대기"}</span></div></div>
              </li>
              {issue ? <li className="relative pb-8"><span aria-hidden="true" className="absolute top-1 -left-[37px] size-4 rounded-full border-[3px] border-primary-600 bg-surface" /><details><summary className="flex min-h-11 cursor-pointer list-none items-start justify-between gap-3"><span><strong className="block text-lg">현장 보고 · {issue.title}</strong>{reportDate ? <span className="mt-1 block text-sm text-ink-600">{reportDate}</span> : null}</span><CaretDown aria-hidden="true" className="mt-1 shrink-0 text-ink-400" size="var(--icon-sm)" /></summary><div className="mt-3 ui-card p-4 text-sm"><p className="leading-6">{issue.description}</p><p className="mt-2 text-ink-600">처리 상태 · {issue.status === "approved" ? "승인" : issue.status === "rejected" ? "거절" : issue.status === "customer_review" ? "고객 확인 대기" : "업체 처리 중"}</p></div></details></li> : null}
              {scope.approved_changes.map((change) => <li className="relative pb-8" key={change.proposal_id}><span aria-hidden="true" className="absolute top-1 -left-[37px] size-4 rounded-full border-[3px] border-primary-600 bg-surface" /><details><summary className="flex min-h-11 cursor-pointer list-none items-start justify-between gap-3"><span><strong className="block text-lg">승인된 변경 · {change.title}</strong><span className="mt-1 block text-sm text-ink-600">{fullDateFormatter.format(new Date(change.approved_at))}</span></span><CaretDown aria-hidden="true" className="mt-1 shrink-0 text-ink-400" size="var(--icon-sm)" /></summary><div className="mt-3 ui-card p-4 text-sm"><p className="leading-6">{change.reason}</p><p className="mt-3 border-t border-line pt-3 tabular-nums">승인 금액 <strong className="float-right text-primary-700">{money(change.quote.total_amount_krw)}</strong></p></div></details></li>)}
              {!scope.approved_changes.length && !issue ? <li className="relative"><span aria-hidden="true" className="absolute top-1 -left-[37px] size-4 rounded-full border-[3px] border-line bg-surface" /><p className="text-sm text-ink-600">서버에 기록된 이전 변경 이력이 없습니다.</p></li> : null}
            </ol>
          </div>
  </>;
  return presentation === "dialog"
    ? <Dialog onOpenChange={handleOpenChange} open={open}><DialogContent className="max-w-xl p-0">{content}</DialogContent></Dialog>
    : <Sheet onOpenChange={handleOpenChange} open={open}><SheetContent className="!transition-none !transform-none" presentation="page" showClose={false}>{content}</SheetContent></Sheet>;
}
