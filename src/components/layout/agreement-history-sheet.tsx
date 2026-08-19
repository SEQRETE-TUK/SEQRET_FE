import { CaretDownIcon as CaretDown, CaretRightIcon as CaretRight } from "@phosphor-icons/react";
import { useState } from "react";

import { AgreementOverview } from "@/components/layout/agreement-overview";
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

export function AgreementHistorySheet({ fallbackLocationConditions, issue, onOpenChange, open, presentation = "page", scope }: {
  fallbackLocationConditions?: ScopeLocationConditions[];
  issue?: FieldIssue;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  presentation?: "dialog" | "page";
  scope: ScopeReview;
}) {
  const [previousOpen, setPreviousOpen] = useState(false);
  const versionMatch = /^v(\d+)$/i.exec(scope.scope.version_label);
  const previousVersion = versionMatch && Number(versionMatch[1]) > 1 ? `v${Number(versionMatch[1]) - 1}` : "이전 기준";
  const previousScope: ScopeReview = {
    ...scope,
    scope: { ...scope.scope, status: "confirmed", version_label: previousVersion },
    quote: scope.quote ? { ...scope.quote, adjustments: [], total_amount_krw: scope.quote.base_amount_krw } : null,
    collaboration_status: "confirmed",
    agreement_notice: "이전 승인본 기준으로 확인된 작업 범위입니다.",
  };
  const adjustments = scope.quote?.adjustments ?? [];
  const reportDate = issue?.reported_at ? fullDateFormatter.format(new Date(issue.reported_at)) : null;
  const handleOpenChange = (next: boolean) => { if (!next) setPreviousOpen(false); onOpenChange(next); };
  const handleBack = () => { if (previousOpen) setPreviousOpen(false); else handleOpenChange(false); };

  const content = <>
    {presentation === "dialog" ? <div className="flex min-h-16 items-center border-b border-line px-6 pr-16"><DialogTitle>{previousOpen ? `${previousVersion} 확인서` : "변경 이력"}</DialogTitle></div> : <MobilePageHeader onBack={handleBack} title={previousOpen ? `${previousVersion} 확인서` : "변경 이력"} />}
        {previousOpen ? (
          <div className="space-y-2.5 px-[var(--content-gutter)] pb-28 pt-3"><AgreementOverview fallbackLocationConditions={fallbackLocationConditions} onOpenHistory={() => undefined} scope={previousScope} showCurrentStatus={false} showVersionHeader={false} /></div>
        ) : (
          <div className="px-5 py-6">
            <ol className="relative ml-3 border-l-2 border-line pl-7">
              <li className="relative pb-8">
                <span aria-hidden="true" className="absolute top-0 -left-[37px] size-4 rounded-full border-[3px] border-success bg-surface" />
                <div className="flex min-h-11 items-start justify-between gap-3">
                  <span><span className="inline-flex rounded-md border border-success px-2 py-0.5 text-ui-micro !font-extrabold text-success">현재 버전</span><strong className="mt-2 block text-ui-section">{scope.scope.version_label} · 현재 확인서</strong></span>
                  <button aria-label="이전 기록 확인" className="grid size-11 shrink-0 place-items-center rounded-full text-ink-400 hover:bg-surface-muted" onClick={() => setPreviousOpen(true)} type="button"><CaretRight aria-hidden="true" size="var(--icon-sm)" /></button>
                </div>
                <div className="mt-3 ui-card p-4 text-sm"><p>짐 {scope.scope.item_count}개 · 작업 {scope.scope.work_count}개</p><p className="mt-3 border-t border-line pt-3 tabular-nums">금액 <strong className="float-right text-primary-700">{money(scope.quote?.total_amount_krw)}</strong></p>{adjustments.length ? <p className="mt-3 text-ink-600">변경 사유: {adjustments.map((item) => item.label).join(" · ")}</p> : null}<div className="mt-3 flex flex-wrap gap-2"><span className="rounded-md bg-success-bg px-2 py-1 text-ui-control text-success-ink">업체 확인</span><span className={`rounded-md px-2 py-1 text-ui-control ${scope.customer_confirmed_at ? "bg-success-bg text-success-ink" : "bg-warning-bg text-warning-ink"}`}>{scope.customer_confirmed_at ? "고객 확인" : "고객 확인 대기"}</span></div></div>
              </li>
              {issue ? <li className="relative pb-8"><span aria-hidden="true" className="absolute top-1 -left-[37px] size-4 rounded-full border-[3px] border-primary-600 bg-surface" /><details><summary className="flex min-h-11 cursor-pointer list-none items-start justify-between gap-3"><span><strong className="block text-lg">현장 보고 · {issue.title}</strong>{reportDate ? <span className="mt-1 block text-sm text-ink-600">{reportDate}</span> : null}</span><CaretDown aria-hidden="true" className="mt-1 shrink-0 text-ink-400" size="var(--icon-sm)" /></summary><div className="mt-3 ui-card p-4 text-sm"><p className="leading-6">{issue.description}</p><p className="mt-2 text-ink-600">처리 상태 · {issue.status === "approved" ? "승인" : issue.status === "rejected" ? "거절" : issue.status === "customer_review" ? "고객 확인 대기" : "업체 처리 중"}</p></div></details></li> : null}
              <li className="relative"><span aria-hidden="true" className="absolute top-1 -left-[37px] size-4 rounded-full border-[3px] border-line bg-surface" /><button className="flex min-h-14 w-full items-start justify-between gap-3 text-left" onClick={() => setPreviousOpen(true)} type="button"><span><strong className="block text-lg">{previousVersion} · 변경 전 기준</strong><span className="mt-1 block text-sm text-ink-600">현재 변경안의 기준 금액</span></span><CaretRight aria-hidden="true" className="mt-1 shrink-0 text-ink-400" size="var(--icon-sm)" /></button></li>
            </ol>
          </div>
        )}
  </>;
  return presentation === "dialog"
    ? <Dialog onOpenChange={handleOpenChange} open={open}><DialogContent className="max-w-xl p-0">{content}</DialogContent></Dialog>
    : <Sheet onOpenChange={handleOpenChange} open={open}><SheetContent className="!transition-none !transform-none" presentation="page" showClose={false}>{content}</SheetContent></Sheet>;
}
