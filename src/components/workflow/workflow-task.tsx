import {
  CheckIcon as Check,
  CaretRightIcon as ChevronRight,
} from "@phosphor-icons/react";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type TaskTone = "neutral" | "primary" | "success" | "warning" | "danger";

export function ProgressSteps({
  current,
  items = ["시작", "범위", "배차", "현장", "완료"],
}: {
  current: number;
  items?: string[];
}) {
  return (
    <ol aria-label="진행 단계" className="grid min-w-0 px-1" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
      {items.map((item, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li className="relative min-w-0 text-center" key={item}>
            {index > 0 ? (
              <span
                aria-hidden="true"
                className={cn(
                  "absolute top-[11px] right-1/2 h-px w-full",
                  done || active ? "bg-primary-400" : "bg-line",
                )}
              />
            ) : null}
            <span
              aria-current={active ? "step" : undefined}
              className={cn(
                "relative mx-auto grid size-6 place-items-center rounded-full border text-xs font-extrabold",
                done && "border-primary-600 bg-primary-600 text-accent-ink",
                active && "border-primary-600 bg-surface text-primary-700",
                !done && !active && "border-line bg-surface text-ink-400",
              )}
            >
              {done ? <Check aria-hidden="true" className="size-3.5" /> : index + 1}
            </span>
            <span className={cn("mt-2 block truncate text-ui-micro font-bold", active ? "text-ink-900" : "text-ink-400")}>{item}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function WorkflowTask({
  blockedReason,
  children,
  defaultOpen = false,
  description,
  detailTitle,
  index,
  leading,
  onOpen,
  status,
  title,
  tone = "neutral",
}: {
  blockedReason?: string | null;
  children: ReactNode;
  defaultOpen?: boolean;
  description: string;
  detailTitle?: string;
  index?: number;
  leading?: ReactNode;
  onOpen?: () => void;
  status: string;
  title: string;
  tone?: TaskTone;
}) {
  const row = (
    <>
      {index ? <span aria-hidden="true" className="absolute top-0 bottom-0 left-[calc(1.25rem+13px)] w-px bg-line group-first:top-1/2 group-last:bottom-1/2" /> : null}
      {index ? (
        <span
          aria-hidden="true"
          className={cn(
            "relative z-10 grid size-[26px] shrink-0 place-items-center rounded-full text-xs font-extrabold tabular-nums ring-4 ring-surface",
            tone === "success" && "bg-success text-white",
            (tone === "primary" || tone === "warning" || tone === "danger") && "bg-primary-600 text-white",
            tone === "neutral" && "border border-line bg-surface text-ink-400",
          )}
        >
          {tone === "success" ? <Check aria-hidden="true" className="size-3.5" weight="bold" /> : index}
        </span>
      ) : null}
      {leading ? <span className="shrink-0 text-primary-700">{leading}</span> : null}
      <span className="min-w-0 flex-1">
        <strong className={cn("block min-w-0 truncate text-ui-support leading-6", (tone === "neutral" || blockedReason) && "text-ink-600")}>{title}</strong>
        <span className="mt-1 block truncate text-sm leading-5 text-ink-600">{blockedReason ?? description}</span>
      </span>
      {blockedReason
        ? <Badge className="max-w-28 shrink-0" variant="neutral">잠김</Badge>
        : <Badge className="max-w-28 shrink-0" variant={tone}>{status}</Badge>}
      {blockedReason ? null : <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-ink-400" />}
    </>
  );
  const rowClass = "interactive-row group relative flex min-h-[84px] w-full items-center gap-4 border-b border-line px-5 py-4 text-left last:border-b-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus-ring";

  // 앞 단계가 끝나지 않아 열 수 없는 단계는 이유를 보여주고 잠근다.
  if (blockedReason) {
    return <div aria-disabled="true" className={cn(rowClass, "cursor-not-allowed bg-surface-muted/60")}>{row}</div>;
  }
  // 이미 전용 화면이 있는 단계는 시트를 열지 않고 그 화면으로 보낸다.
  if (onOpen) {
    return <button className={cn(rowClass, "hover:bg-surface-muted")} onClick={onOpen} type="button">{row}</button>;
  }
  return (
    <Sheet defaultOpen={defaultOpen}>
      <SheetTrigger className={cn(rowClass, "hover:bg-surface-muted")}>{row}</SheetTrigger>
      <SheetContent presentation="page">
        <SheetHeader className="app-safe-header sticky top-0 z-10 border-b border-line bg-surface/98 px-16 py-4 text-center backdrop-blur">
          <SheetTitle>{detailTitle ?? title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <div className="px-5 pb-2">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
