import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
    "inline-flex h-[var(--status-height)] w-fit items-center justify-center rounded-full border border-transparent px-3 whitespace-nowrap",
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
  const classes = [cn(badgeVariants({ variant }), className), "text-ui-status"].filter(Boolean).join(" ");
  return <span className={classes} {...props} />;
}

export { Badge };
