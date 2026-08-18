import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

function Select({ className, ...props }: ComponentProps<"select">) {
  return (
    <select
      data-slot="select"
      className={cn(
        "flex h-[var(--control-touch)] w-full rounded-[var(--radius-control)] border border-input bg-surface px-4 text-ui-body text-ink-900 outline-none disabled:cursor-not-allowed disabled:bg-canvas disabled:text-ink-400 disabled:opacity-60 focus-visible:border-primary-400 focus-visible:ring-3 focus-visible:ring-primary-100 aria-invalid:border-danger aria-invalid:ring-3 aria-invalid:ring-danger/20 aria-invalid:focus-visible:border-danger aria-invalid:focus-visible:ring-danger/20",
        className,
      )}
      {...props}
    />
  );
}

export { Select };
