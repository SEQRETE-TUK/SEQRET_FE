import { CaretRightIcon as ChevronRight } from "@phosphor-icons/react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const compactDateTimeFormatter = new Intl.DateTimeFormat("ko-KR", {
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const moneyFormatter = new Intl.NumberFormat("ko-KR");

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
      <strong className="mt-2 block min-w-0 break-words text-[17px] leading-6">{title}</strong>
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
      <h3 className="mt-1 text-[18px] leading-6 font-extrabold tracking-[-0.025em]">{action}</h3>
      <p className="mt-1 text-sm leading-5 text-ink-600">{children}</p>
      {updatedAt ? <p className="mt-2 text-xs font-semibold text-ink-400">마지막 변경 {compactDateTimeFormatter.format(new Date(updatedAt))}</p> : null}
    </section>
  );
}

export function MoneyBreakdown({
  adjustments,
  baseAmount,
  totalAmount,
}: {
  adjustments: Array<{ amount: number; label: string }>;
  baseAmount: number;
  totalAmount: number;
}) {
  return (
    <dl className="mt-3 border-y border-line text-sm tabular-nums">
      <div className="flex items-center justify-between gap-4 py-3">
        <dt className="text-ink-600">기본 금액</dt>
        <dd className="font-bold">{moneyFormatter.format(baseAmount)}원</dd>
      </div>
      {adjustments.map(({ amount, label }, index) => (
        <div className="flex items-start justify-between gap-4 border-t border-line py-3" key={`${label}-${index}`}>
          <dt className="min-w-0 break-words text-ink-600">{label}</dt>
          <dd className="shrink-0 font-bold">{amount > 0 ? "+" : ""}{moneyFormatter.format(amount)}원</dd>
        </div>
      ))}
      <div className="flex items-center justify-between gap-4 border-t-2 border-ink-900 py-3 text-base">
        <dt className="font-extrabold">제안 총액</dt>
        <dd className="font-black text-primary-800">{moneyFormatter.format(totalAmount)}원</dd>
      </div>
    </dl>
  );
}

export function ConfirmationStatus({
  companyConfirmedAt,
  customerConfirmedAt,
}: {
  companyConfirmedAt: string | null;
  customerConfirmedAt: string | null;
}) {
  const items = [
    { label: "업체", value: companyConfirmedAt },
    { label: "고객", value: customerConfirmedAt },
  ];
  return (
    <ul className="mt-3 divide-y divide-line border-y border-line" aria-label="역할별 확인 상태">
      {items.map(({ label, value }) => (
        <li className="flex min-h-12 items-center justify-between gap-4 py-2 text-sm" key={label}>
          <span className="font-bold">{label} 확인</span>
          <span className={cn("text-right font-semibold", value ? "text-success-ink" : "text-warning-ink")}>
            {value ? compactDateTimeFormatter.format(new Date(value)) : "확인 전"}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function ActivityTimeline({
  items,
}: {
  items: Array<{ actor: ReactNode; detail?: ReactNode; time?: string | null; title: ReactNode }>;
}) {
  return (
    <ol className="mt-3" aria-label="상태 변경 이력">
      {items.map(({ actor, detail, time, title }, index) => (
        <li className="relative grid min-w-0 grid-cols-[20px_minmax(0,1fr)] gap-3 pb-5 last:pb-0" key={index}>
          <span aria-hidden="true" className="relative mt-1 grid size-5 place-items-center rounded-full border border-primary-400 bg-surface">
            <span className="size-1.5 rounded-full bg-primary-600" />
            {index < items.length - 1 ? <span className="absolute top-5 h-[calc(100%+4px)] w-px bg-line" /> : null}
          </span>
          <div className="min-w-0">
            <div className="flex min-w-0 items-start justify-between gap-3">
              <strong className="min-w-0 break-words text-sm leading-5">{title}</strong>
              {time ? <time className="shrink-0 text-[11px] font-semibold text-ink-400" dateTime={time}>{compactDateTimeFormatter.format(new Date(time))}</time> : null}
            </div>
            <p className="mt-1 text-xs font-semibold text-ink-600">{actor}</p>
            {detail ? <p className="mt-1 text-sm leading-5 text-ink-600">{detail}</p> : null}
          </div>
        </li>
      ))}
    </ol>
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
      <h2 className="mt-2 max-w-[21rem] text-[30px] leading-[1.22] font-extrabold tracking-[-0.045em]">{title}</h2>
      {description ? <p className="mt-2 max-w-[22rem] text-[15px] leading-6 text-ink-600">{description}</p> : null}
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
  return <span className={cn("inline-flex min-h-7 items-center rounded-lg px-2.5 text-xs font-extrabold", toneClass)}>{children}</span>;
}

export function PriorityPanel({
  action,
  description,
  label,
  meta,
  title,
  tone = "primary",
}: {
  action: ReactNode;
  description?: ReactNode;
  label: ReactNode;
  meta?: ReactNode;
  title: ReactNode;
  tone?: "primary" | "warning";
}) {
  return (
    <section
      className={cn(
        "mt-7 rounded-[var(--radius-card)] border px-5 py-5",
        tone === "primary" ? "border-primary-100 bg-primary-50/70" : "border-warning bg-warning-bg",
      )}
    >
      <StatusTag tone={tone}>{label}</StatusTag>
      <h3 className="mt-4 text-[21px] leading-7 font-extrabold tracking-[-0.03em]">{title}</h3>
      {description ? <p className="mt-2 text-sm leading-5 text-ink-600">{description}</p> : null}
      {meta ? <div className="mt-4 border-t border-current/10 pt-3 text-sm font-bold text-ink-600">{meta}</div> : null}
      <div className="mt-5">{action}</div>
    </section>
  );
}

export function PriorityFacts({ items }: { items: Array<{ label: ReactNode; value: ReactNode }> }) {
  return (
    <dl className="grid divide-x divide-current/10" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
      {items.map(({ label, value }, index) => (
        <div className={cn("min-w-0", index === 0 ? "pr-2" : "px-2 last:pr-0")} key={String(label)}>
          <dt className="truncate text-[11px] font-bold text-ink-600">{label}</dt>
          <dd className="mt-1 min-w-0 break-keep text-[13px] leading-5 font-extrabold text-ink-900 tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function SectionHeader({ aside, children, className }: { aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex min-h-8 items-end justify-between gap-3", className)}>
      <h3 className="text-[19px] leading-7 font-extrabold tracking-[-0.035em]">{children}</h3>
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
        variant === "contained" && "rounded-[var(--radius-input)] border border-line bg-surface",
        variant === "plain" && "app-list-plain border-y border-line",
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
        <strong className="block min-w-0 break-keep text-[15px] leading-6">{children}</strong>
        {description ? <span className="mt-0.5 block min-w-0 text-sm leading-5 text-ink-600">{description}</span> : null}
      </span>
      {end ? <span className="max-w-[48%] shrink-0 text-right text-sm font-bold text-ink-600">{end}</span> : null}
      {onClick ? <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-ink-400" /> : null}
    </>
  );
  const classes = cn(
    "interactive-row flex min-h-[68px] w-full items-center gap-3 border-b border-line px-4 py-3 text-left last:border-b-0",
    selected && "bg-primary-50/70",
  );
  return onClick ? <button className={classes} onClick={onClick} type="button">{content}</button> : <div className={classes}>{content}</div>;
}

export function InfoCallout({ children, icon }: { children: ReactNode; icon: ReactNode }) {
  return (
    <aside className="mt-6 flex items-start gap-3 rounded-[var(--radius-input)] border border-line bg-surface-muted px-4 py-3 text-sm leading-5 text-ink-600">
      <span className="mt-0.5 shrink-0 text-primary-700">{icon}</span>
      <p>{children}</p>
    </aside>
  );
}
