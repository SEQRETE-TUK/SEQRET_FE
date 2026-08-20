import { ArrowRightIcon as ArrowRight, CalendarBlankIcon as Calendar, CaretRightIcon as ChevronRight, CheckIcon as Check, MinusIcon as Minus, PlusIcon as Plus, XIcon as X } from "@phosphor-icons/react";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const compactDateTimeFormatter = new Intl.DateTimeFormat("ko-KR", {
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function WorkContext({
  code,
  route,
  scheduledAt,
  status,
  title,
  version,
}: {
  code?: string | null;
  route?: ReactNode;
  scheduledAt?: string | null;
  status?: ReactNode;
  title: ReactNode;
  version?: string | null;
}) {
  const schedule = scheduledAt ? compactDateTimeFormatter.format(new Date(scheduledAt)) : "일정 확인 중";
  return (
    <section aria-label="현재 작업 맥락" className="mt-6 border-y border-line py-4">
      {code || status ? <div className={cn("flex min-w-0 items-center justify-between gap-3", !code && "justify-end")}>
        {code ? <p className="min-w-0 truncate text-ui-control text-ink-600">작업 {code}</p> : null}
        {status}
      </div> : null}
      <strong className="mt-2 block min-w-0 break-words text-ui-component leading-6">{title}</strong>
      {route ? <p className="mt-1 min-w-0 break-words text-sm leading-5 text-ink-600">{route}</p> : null}
      <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-xs font-semibold text-ink-400">이사 일정</dt>
          <dd className="mt-1 font-bold tabular-nums">{schedule}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold text-ink-400">현재 범위</dt>
          <dd className="mt-1 font-bold">{version ?? "준비 중"}</dd>
        </div>
      </dl>
    </section>
  );
}

export function PageIntro({
  description,
  eyebrow,
  title,
}: {
  description?: ReactNode;
  eyebrow?: ReactNode;
  title: ReactNode;
}) {
  return (
    <header>
      {eyebrow ? <p className="text-sm font-bold text-primary-700">{eyebrow}</p> : null}
      <h2 className="mt-2 max-w-[22rem] text-ui-section leading-9 font-extrabold tracking-[var(--tracking-display)]">{title}</h2>
      {description ? <p className="mt-2 max-w-[22rem] text-ui-control leading-6 text-ink-600">{description}</p> : null}
    </header>
  );
}

export function StatusTag({ children, tone = "primary" }: { children: ReactNode; tone?: "primary" | "success" | "warning" | "neutral" }) {
  return <Badge variant={tone}>{children}</Badge>;
}

export function FilterChip({ active = false, children, onClick }: { active?: boolean; children: ReactNode; onClick: () => void }) {
  return <button aria-pressed={active} className={`min-h-9 whitespace-nowrap rounded-full border px-[var(--filter-padding-x)] text-ui-support ${active ? "border-primary-600 bg-primary-50 text-primary-700" : "border-line bg-surface text-ink-600"}`} onClick={onClick} type="button">{children}</button>;
}

export function ActiveMoveCard({ children, heading, headingClassName, leading, meta, onOpen, prelude, route, showChevron = true }: { children?: ReactNode; heading: ReactNode; headingClassName?: string; leading?: ReactNode; meta: ReactNode; onOpen: () => void; prelude?: ReactNode; route: ReactNode; showChevron?: boolean }) {
  const card = <section className={cn("ui-card p-3 shadow-[var(--shadow-card)]", !prelude && "mt-4")}><button className="flex min-h-13 w-full items-center gap-3 text-left" onClick={onOpen} type="button">{leading}<span className="min-w-0 flex-1"><strong className="block truncate text-ui-component">{route}</strong><span className="mt-1 block text-sm text-ink-600">{meta}</span></span>{showChevron ? <ChevronRight aria-hidden="true" className="shrink-0 text-ink-400" size="var(--icon-md)" /> : null}</button>{children}</section>;
  return <div className="mt-6"><h2 className={cn("text-ui-component font-black", headingClassName)}>{heading}</h2>{prelude ? <div className="mt-4 rounded-[var(--radius-component)] bg-[var(--color-stage)] pb-2 shadow-[var(--shadow-card)]">{card}<div className="px-3 [&>ol]:mt-2">{prelude}</div></div> : card}</div>;
}

export function MoveRouteSummary({ destination, origin }: { destination: string; origin: string }) {
  return <span className="grid min-w-0 grid-cols-[minmax(0,1fr)_32px_minmax(0,1fr)] items-center gap-2 whitespace-normal"><span className="min-w-0"><span className="block text-ui-micro !font-medium text-ink-400">출발지</span><span className="mt-0.5 block truncate text-ui-component text-ink-900">{origin}</span></span><span className="grid size-8 place-items-center text-primary-700"><ArrowRight aria-hidden="true" size="var(--icon-md)" weight="bold" /></span><span className="min-w-0"><span className="block text-ui-micro !font-medium text-ink-400">도착지</span><span className="mt-0.5 block truncate text-ui-component text-ink-900">{destination}</span></span></span>;
}

export function MoveSummaryCard({ badge, destination, meta, onOpen, origin, stats }: { badge?: ReactNode; destination: string; meta: ReactNode; onOpen: () => void; origin: string; stats: Array<{ icon: ReactNode; label: ReactNode }> }) {
  return <button className="press-static w-full ui-card p-3 text-left shadow-[var(--shadow-card)]" onClick={onOpen} type="button"><strong className="block text-ui-component"><MoveRouteSummary destination={destination} origin={origin} /></strong><span className="mt-4 flex min-w-0 items-center gap-2 rounded-[var(--radius-component)] border border-line bg-surface px-2.5 py-2 text-ui-control text-ink-900"><Calendar aria-hidden="true" className="shrink-0 text-primary-700" size="var(--icon-sm)" weight="bold" /><span className="min-w-0 flex-1 truncate">{meta}</span>{badge ? <b className="shrink-0 rounded-[var(--radius-component)] bg-primary-50 px-2.5 py-1.5 font-[var(--weight-button)] text-primary-700">{badge}</b> : null}</span><span className="mt-4 grid divide-x divide-line text-center text-xs text-ink-600" style={{ gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))` }}>{stats.map((stat, index) => <span className="flex flex-col items-center gap-1" key={index}>{stat.icon}{stat.label}</span>)}</span></button>;
}

export function MoveJourneyProgress({ current, steps = ["짐 목록 확인", "업체 제안", "내 확인", "공동확인 완료"] }: { current: number; steps?: string[] }) {
  return <ol aria-label="공동확인 진행 단계" className="mt-3 grid" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>{steps.map((label, index) => { const step = index + 1; const done = step < current; const active = step === current; return <li aria-current={active ? "step" : undefined} className="relative min-w-0 text-center" key={label}>{index > 0 ? <span aria-hidden="true" className={`absolute top-3 right-1/2 h-0.5 w-full ${step <= current ? "bg-primary-600" : "bg-ink-400/25"}`} /> : null}<span className={`relative z-10 mx-auto grid size-6 place-items-center rounded-full border-2 text-xs font-semibold ${done ? "border-primary-600 bg-primary-600 text-white" : active ? "border-primary-600 bg-primary-50 text-primary-700" : "border-ink-400/25 bg-surface text-ink-400"}`}>{done ? <Check aria-hidden="true" size="var(--icon-xs)" weight="bold" /> : step}</span><span className={`mt-1.5 block break-keep whitespace-pre-line px-1 text-xs font-[var(--weight-button)] leading-4 ${active || done ? "text-primary-700" : "text-ink-600"}`}>{label}</span></li>; })}</ol>;
}

export function SectionHeader({ aside, children, className }: { aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex min-h-8 items-end justify-between gap-3", className)}>
      <h3 className="text-ui-component">{children}</h3>
      {aside ? <div className="pb-0.5 text-ui-control text-ink-600">{aside}</div> : null}
    </div>
  );
}

export function ListGroup({
  children,
  className,
  label,
  variant = "contained",
}: {
  children: ReactNode;
  className?: string;
  label?: string;
  variant?: "contained" | "plain";
}) {
  return (
    <div
      aria-label={label}
      className={cn(
        "mt-3 overflow-hidden",
        variant === "contained" && "ui-card rounded-[var(--radius-component)] shadow-[var(--shadow-card)]",
        variant === "plain" && "app-list-plain",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function ListRow({
  className,
  children,
  description,
  end,
  leading,
  onClick,
  selected = false,
}: {
  className?: string;
  children: ReactNode;
  description?: ReactNode;
  end?: ReactNode;
  leading?: ReactNode;
  onClick?: () => void;
  selected?: boolean;
}) {
  const content = (
    <>
      {leading ? <span className="shrink-0 overflow-hidden">{leading}</span> : null}
      <span className="min-w-0 flex-1">
        <strong className="block min-w-0 break-keep text-ui-list-title">{children}</strong>
        {description ? <span className="mt-0.5 block min-w-0 text-ui-list-detail text-ink-600">{description}</span> : null}
      </span>
      {end ? <span className="max-w-[48%] shrink-0 text-right text-ui-data text-ink-600">{end}</span> : null}
      {onClick ? <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-ink-400" /> : null}
    </>
  );
  const classes = cn(
    "interactive-row flex min-h-[var(--list-row-min)] w-full items-center gap-3 border-b border-line px-[var(--list-row-padding-x)] py-[var(--list-row-padding-y)] text-left last:border-b-0",
    className,
    selected && "bg-primary-50/70",
  );
  return onClick ? <button className={classes} onClick={onClick} type="button">{content}</button> : <div className={classes}>{content}</div>;
}

export function InventoryQuantityRow({ disabled = false, icon, name, onDecrease, onIncrease, onRemove, quantity, reviewRequired = false }: { disabled?: boolean; icon: ReactNode; name: string; onDecrease: () => void; onIncrease: () => void; onRemove: () => void; quantity: number; reviewRequired?: boolean }) {
  return <article className="grid min-h-14 grid-cols-[36px_32px_minmax(0,1fr)] items-center gap-2 ui-card border border-line px-2 py-1.5 shadow-[var(--shadow-card)] min-[360px]:flex">{disabled ? <span className="size-9" /> : <button aria-label={`${name} 삭제`} className="grid size-9 shrink-0 place-items-center rounded-full text-ink-400 hover:bg-surface-muted hover:text-ink-900" onClick={onRemove} type="button"><X aria-hidden="true" size="var(--icon-sm)" /></button>}<span className="grid size-8 shrink-0 place-items-center text-primary-700">{icon}</span><span className="min-w-0 flex-1"><span className="block text-ui-list-title">{name}</span>{reviewRequired ? <span className="mt-0.5 block text-ui-micro !font-bold text-danger-ink">확인 필요</span> : null}</span><span className="col-span-2 col-start-2 grid shrink-0 grid-cols-[32px_24px_32px] justify-self-end overflow-hidden rounded-md border border-line bg-surface-muted min-[360px]:col-auto min-[360px]:justify-self-auto"><button aria-label={`${name} 수량 줄이기`} className="grid size-8 place-items-center disabled:text-ink-300" disabled={disabled} onClick={onDecrease} type="button"><Minus aria-hidden="true" size="var(--icon-xs)" /></button><output aria-label={`${name} 수량`} className="grid min-h-8 place-items-center bg-surface text-xs font-bold tabular-nums">{quantity}</output><button aria-label={`${name} 수량 늘리기`} className="grid size-8 place-items-center disabled:text-ink-300" disabled={disabled} onClick={onIncrease} type="button"><Plus aria-hidden="true" size="var(--icon-xs)" /></button></span></article>;
}

export function InfoCallout({ children, icon }: { children: ReactNode; icon: ReactNode }) {
  return (
    <aside className="mt-6 flex items-start gap-3 ui-card px-4 py-4 text-sm leading-5 text-ink-600 shadow-[var(--shadow-card)]"> 
      <span className="mt-0.5 shrink-0 text-primary-700">{icon}</span>
      <p>{children}</p>
    </aside>
  );
}
