import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

function Select({ className, ...props }: ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "flex h-12 w-full rounded-[var(--radius-input)] border border-input bg-white px-4 text-base text-ink-900 outline-none disabled:cursor-not-allowed disabled:bg-canvas disabled:text-ink-400 disabled:opacity-60 aria-invalid:border-danger aria-invalid:ring-3 aria-invalid:ring-danger/20 focus-visible:border-primary-600 focus-visible:ring-3 focus-visible:ring-primary-400/25",
        className,
      )}
      {...props}
    />
  );
}

export { Select };
