import { CalendarBlankIcon as CalendarBlank, CaretDownIcon as CaretDown, CaretRightIcon as CaretRight, CaretUpIcon as CaretUp, CheckIcon as Check, CubeIcon as Cube, ElevatorIcon as Elevator, PackageIcon as Package, StairsIcon as Stairs } from "@phosphor-icons/react";
import { useState, type ReactNode } from "react";

import { movingItemCategoryForName } from "@/components/moving-item-assets";
import type { ScopeLocationConditions, ScopeReview } from "@/features/workflow/api/workflow-api";

const money = (value: number | null | undefined) => value == null ? "금액 확인 중" : `${new Intl.NumberFormat("ko-KR").format(value)}원`;
const moveDateFormatter = new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "short" });
const moveTimeFormatter = new Intl.DateTimeFormat("ko-KR", { hour: "numeric", minute: "2-digit" });

export function AgreementOverview({ children, fallbackLocationConditions, hasIssue = false, onOpenHistory, scope, showCurrentStatus = true, showVersionHeader = true }: { children?: ReactNode; fallbackLocationConditions?: ScopeLocationConditions[]; hasIssue?: boolean; onOpenHistory?: () => void; scope: ScopeReview; showCurrentStatus?: boolean; showVersionHeader?: boolean }) {
  const [amountOpen, setAmountOpen] = useState(true);
  const [expanded, setExpanded] = useState<Record<"date" | "origin" | "destination" | "inventory" | "scope", boolean>>({ date: false, origin: false, destination: false, inventory: false, scope: false });
  const toggle = (key: keyof typeof expanded) => setExpanded((current) => ({ ...current, [key]: !current[key] }));
  const pending = scope.collaboration_status === "awaiting_confirmation";
  const originConditions = scope.scope.location_conditions.find((item) => item.kind === "origin") ?? fallbackLocationConditions?.find((item) => item.kind === "origin");
  const destinationConditions = scope.scope.location_conditions.find((item) => item.kind === "destination") ?? fallbackLocationConditions?.find((item) => item.kind === "destination");
  const scheduledAt = scope.job.scheduled_at ? new Date(scope.job.scheduled_at) : null;
  const hasScheduledAt = scheduledAt !== null && !Number.isNaN(scheduledAt.getTime());
  const moveDate = hasScheduledAt ? moveDateFormatter.format(scheduledAt) : "일정 확인 필요";
  const moveDateDetail = hasScheduledAt ? `${moveDate} · ${moveTimeFormatter.format(scheduledAt)}` : "등록된 이사 일정이 없습니다.";
  return <>
    {showVersionHeader ? <div className="-mt-2 mb-1 flex min-h-11 items-center justify-between"><p className="text-ui-data text-ink-600">현재 버전 <strong className="ml-1 text-ink-900">{scope.scope.version_label}</strong></p><button className="flex min-h-11 items-center gap-1 text-ui-data text-primary-700" onClick={onOpenHistory} type="button">변경 이력 {scope.approved_changes.length > 0 ? scope.approved_changes.length : ""} <CaretRight aria-hidden="true" size="var(--icon-xs)" weight="bold" /></button></div> : null}
    {children}
    <section className="ui-card p-3"><h2 className="text-base font-black">금액 내역</h2>{amountOpen ? <div className="mt-3 border-y border-line"><div className="flex items-center justify-between py-3 text-sm"><span>기본 견적</span><strong className="text-ui-data tabular-nums">{money(scope.quote?.base_amount_krw)}</strong></div>{scope.quote?.adjustments.map((item) => <div className="flex items-start justify-between gap-4 py-3 text-sm" key={`${item.label}-${item.amount_krw}`}><span className="min-w-0"><span className="mr-1.5 inline-flex rounded-md border border-warning px-1.5 py-0.5 text-ui-micro !font-extrabold text-warning-ink">추가</span>{item.label}</span><strong className="shrink-0 text-ui-data tabular-nums text-warning-ink">{item.amount_krw > 0 ? "+" : ""}{money(item.amount_krw)}</strong></div>)}</div> : null}<div className="mt-3 flex items-end justify-between gap-3"><strong className="text-ui-support">변경 후 금액</strong><strong className="text-ui-section tracking-[var(--tracking-display)] tabular-nums">{money(scope.quote?.total_amount_krw)}</strong></div><button className="mt-1 flex min-h-9 w-full items-center justify-center gap-1 whitespace-nowrap text-ui-data text-ink-600" onClick={() => setAmountOpen((open) => !open)} type="button">내역 {amountOpen ? "접기" : "펼치기"} {amountOpen ? <CaretUp aria-hidden="true" size="var(--icon-xs)" /> : <CaretDown aria-hidden="true" size="var(--icon-xs)" />}</button></section>
    {showCurrentStatus ? <section className="ui-card p-3"><p className="text-xs text-ink-600">현재 상황</p><h2 className="mt-0.5 text-lg font-black"><span className="text-primary-700">{pending ? "업체 확인 완료" : "공동확인 완료"}</span> · {hasIssue ? "현장 변경 확인" : "작업 범위 확인"}</h2><AgreementProgress pending={pending} /></section> : null}
    <section className="ui-card p-3"><h2 className="text-xs text-ink-600">확인할 내용</h2><ConfirmedRow detail={<p>{moveDateDetail}</p>} expanded={expanded.date} icon={<CalendarBlank aria-hidden="true" size="var(--icon-sm)" weight="duotone" />} label="이사 날짜" onToggle={() => toggle("date")} value={moveDate} /><ConfirmedRow detail={<LocationDetails conditions={originConditions?.conditions} emptyLabel="등록된 출발지 정보가 없습니다." summary={scope.job.origin_summary} />} expanded={expanded.origin} icon={<Stairs aria-hidden="true" size="var(--icon-sm)" weight="duotone" />} label="출발지 정보" onToggle={() => toggle("origin")} value={scope.job.origin_summary ?? conditionSummary(originConditions?.conditions)} /><ConfirmedRow detail={<LocationDetails conditions={destinationConditions?.conditions} emptyLabel="등록된 도착지 정보가 없습니다." summary={scope.job.destination_summary} />} expanded={expanded.destination} icon={<Elevator aria-hidden="true" size="var(--icon-sm)" weight="duotone" />} label="도착지 정보" onToggle={() => toggle("destination")} value={scope.job.destination_summary ?? conditionSummary(destinationConditions?.conditions)} /><ConfirmedRow detail={<InventoryDetails groups={scope.scope.room_groups} />} expanded={expanded.inventory} icon={<Package aria-hidden="true" size="var(--icon-sm)" weight="duotone" />} label="짐 목록" onToggle={() => toggle("inventory")} value={`전체 짐 ${scope.scope.item_count}개`} /><ConfirmedRow detail={<WorkScopeDetails exclusions={scope.scope.exclusions} includedWorks={scope.scope.included_works} />} expanded={expanded.scope} icon={<Cube aria-hidden="true" size="var(--icon-sm)" weight="duotone" />} label="작업 범위" onToggle={() => toggle("scope")} value={`포함 ${scope.scope.included_works.length}개 · 제외 ${scope.scope.exclusions.length}개`} /></section>
  </>;
}

const conditionLabels: Record<string, string> = { detail_address: "상세 주소", residence_type: "주거 형태", floor: "층수", elevator: "엘리베이터", stairs: "계단", ladder: "사다리차", parking_access: "주차", carry_distance: "운반 거리", access_note: "접근 메모" };
const conditionValue = (value: unknown) => typeof value === "object" && value !== null ? Object.values(value).filter(Boolean).join(" · ") : String(value ?? "확인 필요").replaceAll("_", " ");
const conditionSummary = (conditions: Record<string, unknown> | undefined) => {
  if (!conditions || Object.keys(conditions).length === 0) return "조건 확인 필요";
  return Object.values(conditions).filter((value) => value != null && value !== "").map(conditionValue).filter(Boolean).join(" · ") || "조건 확인 필요";
};
function ConditionDetails({ value }: { value: Record<string, unknown> | undefined }) {
  if (!value) return <p>등록된 위치 조건이 없습니다.</p>;
  return <dl className="grid grid-cols-[88px_1fr] gap-y-2">{Object.entries(value).map(([key, item]) => <span className="contents" key={key}><dt className="text-ink-600">{conditionLabels[key] ?? key}</dt><dd>{conditionValue(item)}</dd></span>)}</dl>;
}

function LocationDetails({ conditions, emptyLabel, summary }: { conditions: Record<string, unknown> | undefined; emptyLabel: string; summary: string | null }) {
  return <div className="space-y-3">{summary ? <p className="font-bold">{summary}</p> : <p>{emptyLabel}</p>}<div className="border-t border-line pt-3"><ConditionDetails value={conditions} /></div></div>;
}

function InventoryDetails({ groups }: { groups: ScopeReview["scope"]["room_groups"] }) {
  const items = groups.flatMap((group) => group.items);
  if (!items.length) return <p>등록된 짐이 없습니다.</p>;
  const categories = ["가구", "가전", "기타"] as const;
  const groupedItems = categories.map((category) => ({ category, items: items.filter((item) => movingItemCategoryForName(item.name || item.description) === category) })).filter((group) => group.items.length);
  return <div className="space-y-4">{groupedItems.map(({ category, items: categoryItems }) => <section key={category}><h3 className="flex items-center justify-between font-bold"><span>{category}</span><span className="text-xs text-ink-600">{categoryItems.length}개</span></h3><ul className="mt-2 space-y-2">{categoryItems.map((item) => <li className="flex items-start justify-between gap-3" key={item.item_key}><span><span className="block">{item.name || item.description}</span>{item.work_note ? <span className="mt-0.5 block text-xs text-ink-600">{item.work_note}</span> : null}</span>{item.quantity ? <span className="shrink-0 text-ink-600">{item.quantity}{item.unit ?? ""}</span> : null}</li>)}</ul></section>)}</div>;
}

function WorkScopeDetails({ exclusions, includedWorks }: { exclusions: string[]; includedWorks: string[] }) {
  return <div className="space-y-4"><section><h3 className="font-bold">포함 작업</h3>{includedWorks.length ? <ul className="mt-2 space-y-2">{includedWorks.map((work) => <li className="flex items-center gap-2" key={work}><Check aria-hidden="true" className="text-success" size="var(--icon-xs)" weight="bold" />{work}</li>)}</ul> : <p className="mt-2 text-ink-600">등록된 포함 작업이 없습니다.</p>}</section><section className="border-t border-line pt-3"><h3 className="font-bold">제외 작업</h3>{exclusions.length ? <ul className="mt-2 space-y-2">{exclusions.map((work) => <li key={work}>{work}</li>)}</ul> : <p className="mt-2 text-ink-600">등록된 제외 작업이 없습니다.</p>}</section></div>;
}

function AgreementProgress({ pending }: { pending: boolean }) {
  const current = pending ? 3 : 4;
  const steps = ["촬영", "업체 제안", "내 확인", "공동확인"];
  return <ol className="mt-3 grid grid-cols-4">{steps.map((label, index) => { const step = index + 1; const done = step < current; const active = step === current; return <li className="relative text-center" key={label}>{index > 0 ? <span aria-hidden="true" className={`absolute top-3 right-1/2 h-0.5 w-full ${step <= current ? done ? "bg-success" : "bg-primary-600" : "bg-line"}`} /> : null}<span className={`relative z-10 mx-auto grid size-6 place-items-center rounded-full border-2 text-ui-micro !font-black ${done ? "border-success bg-success text-white" : active ? "border-primary-600 bg-primary-600 text-white" : "border-line bg-surface-muted text-ink-400"}`}>{done ? <Check aria-hidden="true" size="var(--icon-xs)" weight="bold" /> : step}</span><span className={`mt-1 block text-ui-micro !font-bold ${active ? "text-primary-700" : done ? "text-success" : "text-ink-600"}`}>{label}</span></li>; })}</ol>;
}

function ConfirmedRow({ detail, expanded, icon, label, onToggle, value }: { detail: ReactNode; expanded: boolean; icon: ReactNode; label: string; onToggle: () => void; value: string }) {
  return <div className="border-b border-line last:border-b-0"><button aria-expanded={expanded} className="press-static flex min-h-12 w-full items-center gap-2.5 text-left" onClick={onToggle} type="button"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-50 text-primary-700">{icon}</span><strong className="text-ui-data">{label}</strong><span className="ml-auto max-w-[58%] truncate text-right text-xs text-ink-600">{value}</span>{expanded ? <CaretUp aria-hidden="true" className="shrink-0 text-ink-400" size="var(--icon-xs)" /> : <CaretDown aria-hidden="true" className="shrink-0 text-ink-400" size="var(--icon-xs)" />}</button><div className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none ${expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}><div className="overflow-hidden"><div className="mb-3 rounded-xl bg-surface-muted px-4 py-3 text-ui-data leading-5">{detail}</div></div></div></div>;
}
