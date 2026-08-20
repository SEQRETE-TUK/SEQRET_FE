import { CheckIcon as Check } from "@phosphor-icons/react";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

function CheckIndicator({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-grid size-5 shrink-0 place-items-center rounded-md border border-primary-100 bg-primary-50 text-primary-700", className)}
      data-slot="check-indicator"
      {...props}
    >
      <Check size="var(--icon-xs)" weight="bold" />
    </span>
  );
}

export { CheckIndicator };
