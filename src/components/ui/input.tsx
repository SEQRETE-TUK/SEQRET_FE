import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

function Input({ className, type = "text", ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "flex h-11 w-full rounded-[var(--radius-control)] border border-input bg-surface px-4 text-base text-ink-900 shadow-none outline-2 outline-transparent outline-offset-1 placeholder:text-ink-400 disabled:cursor-not-allowed disabled:bg-canvas disabled:text-ink-400 disabled:opacity-60 aria-invalid:border-danger aria-invalid:ring-3 aria-invalid:ring-danger/20 focus-visible:border-primary-600 focus-visible:outline-focus-ring",
        className,
      )}
      type={type}
      {...props}
    />
  );
}

export { Input };
