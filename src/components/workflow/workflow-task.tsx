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
  children,
  defaultOpen = false,
  description,
  detailTitle,
  leading,
  status,
  title,
  tone = "neutral",
}: {
  children: ReactNode;
  defaultOpen?: boolean;
  description: string;
  detailTitle?: string;
  index?: number;
  leading?: ReactNode;
  status: string;
  title: string;
  tone?: TaskTone;
}) {
  return (
    <Sheet defaultOpen={defaultOpen}>
      <SheetTrigger
        className={cn(
          "interactive-row flex min-h-[76px] w-full items-center gap-3 border-b border-line px-4 py-3 text-left last:border-b-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus-ring",
          tone === "primary" && "bg-primary-50/60",
          tone === "warning" && "bg-warning-bg/55",
        )}
      >
        {leading ? <span className="shrink-0 text-primary-700">{leading}</span> : null}
        <span className="min-w-0 flex-1">
          <strong className="block min-w-0 truncate text-ui-support leading-6">{title}</strong>
          <span className="mt-1 block truncate text-sm leading-5 text-ink-600">{description}</span>
        </span>
        <Badge className="max-w-24 shrink-0" variant={tone}>{status}</Badge>
        <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-ink-400" />
      </SheetTrigger>
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
