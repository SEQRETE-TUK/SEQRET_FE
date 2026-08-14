import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex h-[26px] w-fit items-center justify-center rounded-full border border-transparent px-3 text-[12px] leading-4 font-semibold whitespace-nowrap",
  {
    variants: {
      variant: {
        primary: "bg-primary-100 text-primary-700",
        neutral: "bg-[#F1F2F6] text-ink-600",
        success: "bg-success-bg text-success",
        warning: "bg-warning-bg text-[#9A6200]",
        danger: "bg-danger-bg text-danger",
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

export { Badge, badgeVariants };
