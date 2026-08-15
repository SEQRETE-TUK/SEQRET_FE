import { CaretRightIcon as ChevronRight } from "@phosphor-icons/react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

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
        <div className={cn("min-w-0", index === 0 ? "pr-3" : "px-3 last:pr-0")} key={String(label)}>
          <dt className="truncate text-[11px] font-bold text-ink-600">{label}</dt>
          <dd className="mt-1 truncate text-sm font-extrabold text-ink-900">{value}</dd>
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
