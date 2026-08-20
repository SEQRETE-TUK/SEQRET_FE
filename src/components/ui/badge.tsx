import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
    "inline-flex w-fit items-center justify-center rounded-lg border border-transparent px-2.5 py-1 whitespace-nowrap font-bold",
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
  return <span className={`${cn(badgeVariants({ variant }), className)} text-ui-micro !font-bold`} {...props} />;
}

export { Badge };
