import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "ui-button relative inline-flex touch-manipulation items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-control)] border text-sm font-semibold select-none shadow-none transition-[transform,opacity,background-color,border-color] duration-[var(--dur-micro)] ease-[var(--ease-out)] disabled:cursor-not-allowed disabled:border-ink-400 disabled:bg-ink-400 disabled:!text-white disabled:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring active:translate-y-px [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "border-primary-600 bg-primary-600 !text-white hover:bg-primary-700",
        outline: "border-primary-400 bg-surface text-primary-700 hover:border-primary-600 hover:bg-primary-50",
        secondary: "border-transparent bg-primary-50 text-primary-700 hover:bg-primary-100",
        ghost: "border-transparent bg-transparent text-ink-600 hover:bg-surface-muted",
        destructive: "border-danger bg-surface text-danger-ink hover:bg-danger-bg",
        kakao: "border-[var(--color-kakao)] bg-[var(--color-kakao)] text-[var(--color-kakao-ink)] hover:bg-[var(--color-kakao-hover)]",
      },
      size: {
        default: "h-[var(--control-default)] px-4",
        cta: "h-[var(--control-touch)] px-5 text-ui-control",
        chip: "h-[var(--control-compact)] px-3 text-ui-data",
        icon: "size-[var(--control-default)] rounded-full p-0",
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
  return <ButtonPrimitive className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

function ButtonLink({
  className,
  variant,
  size,
  ...props
}: ComponentProps<"a"> & VariantProps<typeof buttonVariants>) {
  return <a className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export { Button, ButtonLink };
