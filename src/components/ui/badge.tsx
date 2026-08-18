import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex h-[var(--status-height)] w-fit items-center justify-center rounded-full border border-transparent px-3 text-xs leading-4 font-[var(--weight-status)] tracking-[var(--tracking-none)] whitespace-nowrap",
  {
    variants: {
      variant: {
        primary: "bg-primary-100 text-primary-700",
        neutral: "bg-canvas text-ink-600",
        success: "bg-success-bg text-success-ink",
        warning: "bg-warning-bg text-warning-ink",
        danger: "bg-danger-bg text-danger-ink",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

function Badge({
  className,
  variant,
  ...props
}: ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge };
