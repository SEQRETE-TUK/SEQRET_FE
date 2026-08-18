import type { ReactNode } from "react";

export function MobileFrame({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mobile-frame ${className}`}>{children}</div>;
}
