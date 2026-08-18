import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

function Card({ className, variant = "plain", ...props }: ComponentProps<"div"> & { variant?: "plain" | "outlined" }) {
  return <div className={cn("ui-card", className)} data-variant={variant} {...props} />;
}

export { Card };
