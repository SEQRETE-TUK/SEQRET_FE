import {
  ArticleIcon as Article,
  CaretDownIcon as CaretDown,
  CubeIcon as Cube,
  FlowArrowIcon as FlowArrow,
  ListIcon as List,
  StackIcon as Stack,
} from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

import type { DesignSystemNavigationGroup } from "./design-system-data";

const VIEWPORT_MARKER = 160;
const groupIcons = {
  principles: Article,
  foundations: Stack,
  components: Cube,
  patterns: FlowArrow,
} as const;

export function DesignSystemRail({ groups }: { groups: ReadonlyArray<DesignSystemNavigationGroup> }) {
  const targetIds = useMemo(
    () => groups.flatMap((group) => [group.id, ...group.items.map((item) => item.id)]),
    [groups],
  );
  const [activeId, setActiveId] = useState(() => window.location.hash.slice(1) || targetIds[0]);
  const [expandedGroups, setExpandedGroups] = useState(() => new Set(groups.map((group) => group.id)));
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    let frame = 0;
    let hashFrame = 0;
    const updateActiveSection = () => {
      frame = 0;
      const targets = targetIds
        .map((id) => document.getElementById(id))
        .filter((section): section is HTMLElement => Boolean(section));
      if (targets.length === 0) return;

      const atPageEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      const current = atPageEnd
        ? targets.at(-1)
        : [...targets].reverse().find((section) => section.getBoundingClientRect().top <= VIEWPORT_MARKER) ?? targets[0];
      const nextId = current?.id ?? targetIds[0];
      setActiveId(nextId);

      const activeGroup = groups.find((group) => group.id === nextId || group.items.some((item) => item.id === nextId));
      if (activeGroup) {
        setExpandedGroups((currentGroups) => {
          if (currentGroups.has(activeGroup.id)) return currentGroups;
          return new Set([...currentGroups, activeGroup.id]);
        });
      }
    };
    const scheduleUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(updateActiveSection);
    };

    const alignHashTarget = () => {
      const hashId = window.location.hash.slice(1);
      const target = hashId ? document.getElementById(hashId) : null;
      if (!target || !targetIds.includes(hashId)) return;
      target.scrollIntoView({ behavior: "auto", block: "start" });
      setActiveId(hashId);
    };

    updateActiveSection();
    hashFrame = window.requestAnimationFrame(alignHashTarget);
    void document.fonts.ready.then(alignHashTarget);
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("hashchange", alignHashTarget);
    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("hashchange", alignHashTarget);
      if (frame) window.cancelAnimationFrame(frame);
      if (hashFrame) window.cancelAnimationFrame(hashFrame);
    };
  }, [groups, targetIds]);

  const toggleGroup = (id: string) => {
    setExpandedGroups((currentGroups) => {
      const nextGroups = new Set(currentGroups);
      if (nextGroups.has(id)) nextGroups.delete(id);
      else nextGroups.add(id);
      return nextGroups;
    });
  };

  const selectSection = (id: string) => {
    const target = document.getElementById(id);
    if (!target) return;
    window.history.replaceState(null, "", `#${id}`);
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveId(id);
    setMobileOpen(false);
  };

  const renderNavigation = (instance: "desktop" | "mobile") => (
    <nav aria-label="디자인 시스템 목차" className="space-y-1">
      {groups.map((group) => {
        const Icon = groupIcons[group.id as keyof typeof groupIcons] ?? Article;
        const expanded = expandedGroups.has(group.id);
        const groupActive = activeId === group.id || group.items.some((item) => item.id === activeId);
        const itemListId = `${instance}-${group.id}-items`;

        return (
          <div key={group.id}>
            <button
              aria-controls={itemListId}
              aria-current={activeId === group.id ? "location" : undefined}
              aria-expanded={expanded}
              className={cn(
                "press-static flex min-h-9 w-full items-center justify-between rounded-[var(--radius-small)] px-2.5 text-xs leading-4 font-semibold text-ink-600 hover:bg-surface-muted hover:text-ink-900 active:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
                groupActive && "text-ink-900",
              )}
              onClick={() => toggleGroup(group.id)}
              type="button"
            >
              <span className="flex min-w-0 items-center gap-2">
                <Icon aria-hidden="true" className="size-3.5 shrink-0 text-ink-400" />
                <span className="truncate">{group.label}</span>
              </span>
              <CaretDown
                aria-hidden="true"
                className={cn("size-3 shrink-0 transition-transform duration-[var(--dur-micro)] motion-reduce:transition-none", expanded && "rotate-180")}
              />
            </button>

            <div className="relative mt-1 mb-2 ml-[1.125rem] space-y-0.5 border-l border-line pl-3" hidden={!expanded} id={itemListId}>
              {group.items.map((item) => {
                const active = activeId === item.id;
                return (
                  <a
                    aria-current={active ? "location" : undefined}
                    className={cn(
                      "press-static relative flex min-h-8 items-center rounded-[var(--radius-small)] px-2 text-xs leading-4 font-medium text-ink-600 hover:bg-surface-muted hover:text-ink-900 active:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
                      active && "bg-primary-50 font-semibold text-primary-700 before:absolute before:inset-y-2 before:-left-3 before:w-0.5 before:rounded-full before:bg-primary-600",
                    )}
                    href={`#${item.id}`}
                    key={item.id}
                    onClick={(event) => {
                      event.preventDefault();
                      selectSection(item.id);
                    }}
                  >
                    <span className="truncate">{item.label}</span>
                  </a>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );

  return (
    <>
      <aside className="sticky top-16 hidden h-[calc(100dvh-4rem)] overflow-y-auto border-r border-line px-3 py-4 lg:block">
        {renderNavigation("desktop")}
      </aside>

      <Sheet onOpenChange={setMobileOpen} open={mobileOpen}>
        <SheetTrigger className="fixed right-5 bottom-5 z-[var(--z-sticky)] inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm font-semibold text-ink-900 shadow-[var(--shadow-raised)] lg:hidden">
          <List aria-hidden="true" className="size-5 text-primary-700" />
          목차
        </SheetTrigger>
        <SheetContent className="max-h-[78dvh] px-5 pb-8">
          <SheetHeader className="px-0">
            <SheetTitle>디자인 시스템 목차</SheetTitle>
            <SheetDescription>현재 섹션을 확인하고 필요한 기준으로 이동합니다.</SheetDescription>
          </SheetHeader>
          <div className="mt-2 [&_a]:min-h-11 [&_button]:min-h-11">{renderNavigation("mobile")}</div>
        </SheetContent>
      </Sheet>
    </>
  );
}
