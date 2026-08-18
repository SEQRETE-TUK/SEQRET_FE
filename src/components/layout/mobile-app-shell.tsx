import {
  ArrowClockwiseIcon as RefreshCw,
  BellIcon as Bell,
  CaretLeftIcon as CaretLeft,
  DotsThreeVerticalIcon as MoreVertical,
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

export function MobileDetailHeader({ backLabel, onBack, onMore, title }: { backLabel: string; onBack: () => void; onMore: () => void; title: ReactNode }) {
  return <header className="app-safe-header sticky top-0 z-[var(--z-sticky)] grid min-h-[68px] grid-cols-[48px_minmax(0,1fr)_48px] items-center bg-surface/98 px-2 backdrop-blur"><button aria-label={backLabel} className="grid size-9 place-items-center rounded-full hover:bg-surface-muted" onClick={onBack} type="button"><CaretLeft aria-hidden="true" size="var(--icon-md)" weight="bold" /></button><h1 className="truncate text-center text-ui-component font-extrabold tracking-[var(--tracking-display)]">{title}</h1><button aria-label="더보기" className="grid size-9 place-items-center rounded-full hover:bg-surface-muted" onClick={onMore} type="button"><MoreVertical aria-hidden="true" size="var(--icon-md)" weight="bold" /></button></header>;
}

export function MobileDetailTabs<T extends string>({ current, items, label, onChange }: { current: T; items: Array<{ id: T; label: string }>; label: string; onChange: (id: T) => void }) {
  return <div aria-label={label} className="sticky top-[68px] z-[calc(var(--z-sticky)-1)] grid border-b border-line bg-surface" role="tablist" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>{items.map((item) => { const active = item.id === current; return <button aria-selected={active} className={cn("relative min-h-11 whitespace-nowrap text-sm font-semibold", active ? "text-primary-700 after:absolute after:inset-x-4 after:bottom-0 after:h-0.5 after:bg-primary-600" : "text-ink-600")} key={item.id} onClick={() => onChange(item.id)} role="tab" type="button">{item.label}</button>; })}</div>;
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
  showNav = true,
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
  showNav?: boolean;
  title: string;
}) {
  return (
    <div className="mobile-stage">
      <div className="mobile-frame min-w-0 bg-canvas">
        {header ?? <header aria-label={`${eyebrow} · ${title}`} className="app-safe-header sticky top-0 z-[var(--z-sticky)] flex min-h-[var(--header-height)] items-center justify-between bg-surface/98 px-[var(--content-gutter)] backdrop-blur" data-root={root || undefined}>
          <h1 className="truncate text-ui-section font-black tracking-[var(--tracking-display)] text-primary-700">짐확정</h1>
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
        {showNav ? <nav
          aria-label="주요 메뉴"
          className="app-safe-bottom fixed inset-x-0 bottom-0 z-[var(--z-sticky)] mx-auto grid min-h-[var(--bottom-rail-height)] w-full max-w-[var(--shell-mobile)] border-t border-line bg-surface/98 px-2 backdrop-blur"
          style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
        >
          {items.map(({ icon: Icon, id, label }) => {
            const active = current === id;
            return (
              <button
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex min-h-13 min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl text-xs font-semibold",
                  active ? "text-primary-700" : "text-ink-400",
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
        </nav> : null}
      </div>
    </div>
  );
}
