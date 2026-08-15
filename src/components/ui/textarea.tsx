import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "flex min-h-24 w-full resize-y rounded-[var(--radius-input)] border border-input bg-surface px-4 py-3 text-base leading-6 text-ink-900 outline-2 outline-transparent outline-offset-1 placeholder:text-ink-400 disabled:cursor-not-allowed disabled:bg-canvas disabled:text-ink-400 disabled:opacity-60 aria-invalid:border-danger aria-invalid:ring-3 aria-invalid:ring-danger/20 focus-visible:border-primary-600 focus-visible:outline-focus-ring",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
