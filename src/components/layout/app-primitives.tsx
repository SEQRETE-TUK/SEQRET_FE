import { CaretRightIcon as ChevronRight, CheckIcon as Check, MinusIcon as Minus, PlusIcon as Plus, XIcon as X } from "@phosphor-icons/react";
import type { ReactNode } from "react";

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
      <div className="flex min-w-0 items-center justify-between gap-3">
        <p className="min-w-0 truncate text-xs font-bold text-ink-600">{code ? `작업 ${code}` : "현재 이사"}</p>
        {status}
      </div>
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

export function HandoffStatus({
  action,
  actor,
  children,
  updatedAt,
}: {
  action: ReactNode;
  actor: ReactNode;
  children: ReactNode;
  updatedAt?: string | null;
}) {
  return (
    <section aria-label="현재 담당자와 다음 행동" className="mt-6 border-l-2 border-primary-600 pl-4">
      <p className="text-xs font-extrabold text-primary-700">현재 담당 · {actor}</p>
      <h3 className="mt-1 text-lg leading-6 font-extrabold tracking-[var(--tracking-display)]">{action}</h3>
      <p className="mt-1 text-sm leading-5 text-ink-600">{children}</p>
      {updatedAt ? <p className="mt-2 text-xs font-semibold text-ink-400">마지막 변경 {compactDateTimeFormatter.format(new Date(updatedAt))}</p> : null}
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
  const toneClass = {
    neutral: "bg-surface-muted text-ink-600",
    primary: "bg-primary-50 text-primary-700",
    success: "bg-success-bg text-success-ink",
    warning: "bg-warning-bg text-warning-ink",
  }[tone];
  return <span className={cn("inline-flex min-h-8 items-center rounded-full px-3 text-xs font-extrabold", toneClass)}>{children}</span>;
}

export function FilterChip({ active = false, children, onClick }: { active?: boolean; children: ReactNode; onClick: () => void }) {
  return <button aria-pressed={active} className={cn("min-h-9 whitespace-nowrap rounded-full border px-3 text-sm font-semibold", active ? "border-primary-600 bg-primary-50 text-primary-700" : "border-line bg-surface text-ink-600")} onClick={onClick} type="button">{children}</button>;
}

export function ActiveMoveCard({ children, heading, leading, meta, onOpen, route }: { children?: ReactNode; heading: ReactNode; leading?: ReactNode; meta: ReactNode; onOpen: () => void; route: ReactNode }) {
  return <section className="mt-4 rounded-[var(--radius-feature)] border border-line bg-surface p-3 shadow-[var(--shadow-card)]"><h2 className="text-ui-component font-black">{heading}</h2><button className="mt-1.5 flex min-h-13 w-full items-center gap-3 text-left" onClick={onOpen} type="button">{leading}<span className="min-w-0 flex-1"><strong className="block truncate text-ui-component">{route}</strong><span className="mt-1 block text-sm text-ink-600">{meta}</span></span><ChevronRight aria-hidden="true" className="shrink-0 text-ink-400" size="var(--icon-md)" /></button>{children}</section>;
}

export function MoveJourneyProgress({ current }: { current: number }) {
  const steps = ["촬영과 짐 검수", "작업범위와\n금액 확인", "공동확인 완료"];
  return <ol className="mt-3 grid grid-cols-3">{steps.map((label, index) => { const step = index + 1; const done = step < current; const active = step === current; return <li className="relative text-center" key={label}>{index > 0 ? <span aria-hidden="true" className={`absolute top-3.5 right-1/2 h-0.5 w-full ${step <= current ? "bg-success" : "bg-line"}`} /> : null}<span className={`relative z-10 mx-auto grid size-7 place-items-center rounded-full border-2 text-xs font-black ${done ? "border-success bg-success text-white" : active ? "border-primary-600 bg-primary-600 text-white" : "border-line bg-surface text-ink-400"}`}>{done ? <Check aria-hidden="true" size="var(--icon-xs)" weight="bold" /> : step}</span><span className={`mt-1.5 block whitespace-pre-line text-ui-micro leading-3.5 font-bold ${active ? "text-primary-700" : done ? "text-ink-900" : "text-ink-600"}`}>{label}</span></li>; })}</ol>;
}

export function SectionHeader({ aside, children, className }: { aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex min-h-8 items-end justify-between gap-3", className)}>
      <h3 className="text-ui-section leading-7 font-extrabold tracking-[var(--tracking-display)]">{children}</h3>
      {aside ? <div className="pb-0.5 text-xs font-bold text-ink-600">{aside}</div> : null}
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
        variant === "contained" && "rounded-[var(--radius-control)] border border-line bg-surface shadow-[var(--shadow-card)]",
        variant === "plain" && "app-list-plain",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function ListRow({
  children,
  description,
  end,
  leading,
  onClick,
  selected = false,
}: {
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
        <strong className="block min-w-0 break-keep text-ui-control leading-6">{children}</strong>
        {description ? <span className="mt-0.5 block min-w-0 text-sm leading-5 text-ink-600">{description}</span> : null}
      </span>
      {end ? <span className="max-w-[48%] shrink-0 text-right text-sm font-bold text-ink-600">{end}</span> : null}
      {onClick ? <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-ink-400" /> : null}
    </>
  );
  const classes = cn(
    "interactive-row flex min-h-16 w-full items-center gap-3 border-b border-line px-4 py-3 text-left last:border-b-0",
    selected && "bg-primary-50/70",
  );
  return onClick ? <button className={classes} onClick={onClick} type="button">{content}</button> : <div className={classes}>{content}</div>;
}

export function InventoryQuantityRow({ icon, name, onDecrease, onIncrease, onRemove, quantity, reviewRequired = false }: { icon: ReactNode; name: string; onDecrease: () => void; onIncrease: () => void; onRemove: () => void; quantity: number; reviewRequired?: boolean }) {
  return <article className="grid min-h-16 grid-cols-[36px_32px_minmax(0,1fr)] items-center gap-2 rounded-xl border border-line bg-surface px-2 py-1.5 shadow-[var(--shadow-card)] min-[360px]:flex"><button aria-label={`${name} 삭제`} className="grid size-9 shrink-0 place-items-center rounded-full text-ink-400 hover:bg-surface-muted hover:text-ink-900" onClick={onRemove} type="button"><X aria-hidden="true" size="var(--icon-sm)" /></button><span className="grid size-8 shrink-0 place-items-center text-primary-700">{icon}</span><span className="min-w-0 flex-1"><strong className="block text-sm leading-5">{name}</strong>{reviewRequired ? <span className="mt-0.5 block text-ui-micro font-bold text-danger-ink">확인 필요</span> : null}</span><span className="col-span-2 col-start-2 grid shrink-0 grid-cols-[36px_28px_36px] justify-self-end overflow-hidden rounded-lg border border-line bg-surface-muted min-[360px]:col-auto min-[360px]:justify-self-auto"><button aria-label={`${name} 수량 줄이기`} className="grid size-9 place-items-center" onClick={onDecrease} type="button"><Minus aria-hidden="true" size="var(--icon-xs)" /></button><output aria-label={`${name} 수량`} className="grid min-h-9 place-items-center bg-surface text-sm font-bold tabular-nums">{quantity}</output><button aria-label={`${name} 수량 늘리기`} className="grid size-9 place-items-center" onClick={onIncrease} type="button"><Plus aria-hidden="true" size="var(--icon-xs)" /></button></span></article>;
}

export function InfoCallout({ children, icon }: { children: ReactNode; icon: ReactNode }) {
  return (
    <aside className="mt-6 flex items-start gap-3 rounded-[var(--radius-card)] border border-line bg-surface px-4 py-4 text-sm leading-5 text-ink-600 shadow-[var(--shadow-card)]">
      <span className="mt-0.5 shrink-0 text-primary-700">{icon}</span>
      <p>{children}</p>
    </aside>
  );
}
