import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

function Label({ className, ...props }: ComponentProps<"label">) {
  return (
    <label
      className={cn("block text-sm font-bold leading-5 text-ink-600", className)}
      {...props}
    />
  );
}

export { Label };
