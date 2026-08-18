import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

function Input({ className, type = "text", ...props }: ComponentProps<"input">) {
  const classes = [
    cn(
      "flex h-[var(--control-touch)] w-full rounded-[var(--radius-control)] border border-input bg-surface px-[var(--field-padding-x)] text-ink-900 shadow-none outline-none placeholder:text-ink-400 disabled:cursor-not-allowed disabled:bg-canvas disabled:text-ink-400 disabled:opacity-60 focus-visible:border-primary-400 focus-visible:ring-3 focus-visible:ring-primary-100 aria-invalid:border-danger aria-invalid:ring-3 aria-invalid:ring-danger/20 aria-invalid:focus-visible:border-danger aria-invalid:focus-visible:ring-danger/20",
      className,
    ),
    "text-ui-body",
  ].filter(Boolean).join(" ");
  return (
    <input
      data-slot="input"
      className={classes}
      type={type}
      {...props}
    />
  );
}

export { Input };
