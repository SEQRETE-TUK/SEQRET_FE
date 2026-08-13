"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";

export function MobileFrame({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <main className={`mobile-frame ${className}`}>{children}</main>;
}

export function StatusBar() {
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const update = () => setTime(new Date());
    const timer = window.setInterval(update, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="status-bar" aria-hidden="true">
      <span suppressHydrationWarning>{time.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false })}</span>
      <span>5G 81%</span>
    </div>
  );
}
