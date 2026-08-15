import {
  ArrowClockwiseIcon as RefreshCw,
  BellIcon as Bell,
} from "@phosphor-icons/react";
import type { ReactNode } from "react";

import type { AppIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

export interface MobileNavItem<T extends string> {
  id: T;
  label: string;
  icon: AppIcon;
}

export function MobileAppShell<T extends string>({
  children,
  current,
  eyebrow,
  items,
  onChange,
  onHeaderAction,
  onRefresh,
  root = false,
  title,
}: {
  children: ReactNode;
  current: T;
  eyebrow: string;
  items: MobileNavItem<T>[];
  onChange: (tab: T) => void;
  onHeaderAction?: () => void;
  onRefresh?: () => void;
  root?: boolean;
  title: string;
}) {
  return (
    <div className="mobile-stage">
      <div className="mobile-frame min-w-0 bg-canvas">
        <header className="app-safe-header sticky top-0 z-[var(--z-sticky)] flex min-h-[var(--header-height)] items-center justify-between border-b border-line bg-surface/98 px-5 backdrop-blur">
          {root ? (
            <h1 className="truncate text-[22px] font-black tracking-[-0.055em]">SEQRET</h1>
          ) : (
            <div className="min-w-0 py-2.5">
              <p className="truncate text-xs font-semibold text-ink-600">{eyebrow}</p>
              <h1 className="mt-0.5 truncate text-[20px] leading-7 font-extrabold tracking-[-0.035em]">{title}</h1>
            </div>
          )}
          {onHeaderAction || onRefresh ? (
            <button
              aria-label={onHeaderAction ? "새 알림 확인" : "최신 상태 불러오기"}
              className="grid size-11 shrink-0 place-items-center rounded-full text-ink-900 hover:bg-surface-muted"
              onClick={onHeaderAction ?? onRefresh}
              type="button"
            >
              {onHeaderAction ? <Bell aria-hidden="true" size="var(--icon-md)" weight="fill" /> : <RefreshCw aria-hidden="true" size="var(--icon-sm)" weight="bold" />}
            </button>
          ) : null}
        </header>
        <main className="min-w-0" id="main-content">{children}</main>
        <nav
          aria-label="주요 메뉴"
          className="app-safe-bottom fixed inset-x-0 bottom-0 z-[var(--z-sticky)] mx-auto grid w-full max-w-[var(--shell-mobile)] border-t border-line bg-surface/98 px-2 pt-1.5 backdrop-blur"
          style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
        >
          {items.map(({ icon: Icon, id, label }) => {
            const active = current === id;
            return (
              <button
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex min-h-[58px] min-w-0 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-semibold",
                  active ? "font-extrabold text-primary-700" : "text-ink-400",
                )}
                key={id}
                onClick={() => onChange(id)}
                type="button"
              >
                <Icon aria-hidden="true" size="var(--icon-md)" weight={active ? "fill" : "regular"} />
                <span className="truncate">{label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
