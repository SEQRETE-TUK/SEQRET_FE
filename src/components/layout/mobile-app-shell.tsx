import {
  ArrowClockwiseIcon as RefreshCw,
  BellIcon as Bell,
  UserCircleIcon as UserCircle,
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
  header,
  items,
  onChange,
  onHeaderAction,
  onProfile,
  onRefresh,
  root = false,
  title,
}: {
  children: ReactNode;
  current: T;
  eyebrow: string;
  header?: ReactNode;
  items: MobileNavItem<T>[];
  onChange: (tab: T) => void;
  onHeaderAction?: () => void;
  onProfile?: () => void;
  onRefresh?: () => void;
  root?: boolean;
  title: string;
}) {
  return (
    <div className="mobile-stage">
      <div className="mobile-frame min-w-0 bg-canvas">
        {header ?? <header aria-label={`${eyebrow} · ${title}`} className="app-safe-header sticky top-0 z-[var(--z-sticky)] flex min-h-[var(--header-height)] items-center justify-between bg-surface/98 px-[var(--content-gutter)] backdrop-blur" data-root={root || undefined}>
          <h1 className="truncate text-[27px] font-black tracking-[-0.075em] text-primary-700">짐확정</h1>
          <div className="flex items-center gap-1">
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
          {onProfile ? (
            <button aria-label="내 정보 열기" className="grid size-11 place-items-center rounded-full text-ink-900 hover:bg-surface-muted" onClick={onProfile} type="button">
              <UserCircle aria-hidden="true" size="28" weight="regular" />
            </button>
          ) : null}
          </div>
        </header>}
        <main className="min-w-0" id="main-content">{children}</main>
        <nav
          aria-label="주요 메뉴"
          className="app-safe-bottom fixed inset-x-0 bottom-0 z-[var(--z-sticky)] mx-auto grid min-h-[var(--bottom-rail-height)] w-full max-w-[var(--shell-mobile)] border-t border-line bg-surface/98 px-2 pt-1.5 shadow-[0_-2px_12px_oklch(0.205_0.018_262/0.04)] backdrop-blur"
          style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
        >
          {items.map(({ icon: Icon, id, label }) => {
            const active = current === id;
            return (
              <button
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex min-h-[62px] min-w-0 flex-col items-center justify-center gap-1 rounded-xl text-[12px] font-semibold",
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
