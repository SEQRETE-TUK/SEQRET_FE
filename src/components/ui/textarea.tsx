import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={`${cn(
        "flex min-h-24 w-full resize-y rounded-[var(--radius-input)] border border-input bg-surface px-4 py-3 text-ink-900 outline-none placeholder:text-ink-400 disabled:cursor-not-allowed disabled:bg-canvas disabled:text-ink-400 disabled:opacity-60 focus-visible:border-primary-400 focus-visible:ring-3 focus-visible:ring-primary-100 aria-invalid:border-danger aria-invalid:ring-3 aria-invalid:ring-danger/20 aria-invalid:focus-visible:border-danger aria-invalid:focus-visible:ring-danger/20",
        className,
      )} text-ui-body`}
      {...props}
    />
  );
}

export { Textarea };
