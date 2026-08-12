import type { ReactNode } from "react";

export function MobileFrame({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <main className={`mobile-frame ${className}`}>{children}</main>;
}

export function StatusBar() {
  return (
    <div className="status-bar" aria-hidden="true">
      <span>9:41</span>
      <span>5G 81%</span>
    </div>
  );
}
