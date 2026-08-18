import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "ui-button ui-button-text relative inline-flex touch-manipulation items-center justify-center gap-[var(--control-gap)] whitespace-nowrap rounded-[var(--radius-control)] border select-none shadow-none disabled:cursor-not-allowed disabled:border-ink-400 disabled:bg-ink-400 disabled:!text-white disabled:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "border-primary-600 bg-primary-600 !text-white hover:bg-primary-700",
        outline: "border-primary-400 bg-surface text-primary-700 hover:border-primary-600 hover:bg-primary-50",
        secondary: "border-transparent bg-primary-50 text-primary-700 hover:bg-primary-100",
        ghost: "border-transparent bg-transparent text-ink-600 hover:text-ink-900",
        destructive: "border-danger bg-danger !text-white hover:bg-danger",
      },
      size: {
        default: "h-[var(--control-touch)] px-[var(--control-padding-x)]",
        cta: "h-[var(--control-touch)] px-[var(--control-padding-x)]",
        chip: "h-[var(--control-compact)] gap-[var(--control-compact-gap)] px-[var(--control-compact-padding-x)]",
        icon: "size-[var(--control-touch)] rounded-full p-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

function Button({
  className,
  variant,
  size,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return <ButtonPrimitive className={cn(buttonVariants({ variant, size: size ?? (variant === "ghost" ? "chip" : "default") }), className)} {...props} />;
}

function ButtonLink({
  className,
  variant,
  size,
  ...props
}: ComponentProps<"a"> & VariantProps<typeof buttonVariants>) {
  return <a className={cn(buttonVariants({ variant, size: size ?? (variant === "ghost" ? "chip" : "default") }), className)} {...props} />;
}

export { Button, ButtonLink };
