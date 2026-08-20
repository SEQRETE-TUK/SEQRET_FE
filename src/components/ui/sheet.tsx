import { Dialog } from "@base-ui/react/dialog";
import {
  ArrowLeftIcon as ArrowLeft,
  XIcon as X,
} from "@phosphor-icons/react";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

const Sheet = Dialog.Root;
const SheetTrigger = Dialog.Trigger;
const SheetClose = Dialog.Close;

function SheetContent({ className, children, nested = false, presentation = "sheet", showClose = true, ...props }: Dialog.Popup.Props & { nested?: boolean; presentation?: "sheet" | "page"; showClose?: boolean }) {
  return (
    <Dialog.Portal>
      <Dialog.Backdrop forceRender={nested} className={cn("demo-sheet-backdrop fixed inset-0 bg-[var(--color-overlay)]", nested ? "demo-sheet-backdrop-nested z-[calc(var(--z-modal)+1)]" : "z-[var(--z-modal)]")} />
      <Dialog.Viewport className={cn("fixed inset-0 flex items-end justify-center", nested ? "z-[calc(var(--z-modal)+1)]" : "z-[var(--z-modal)]")}>
        <Dialog.Popup
          data-presentation={presentation}
          className={cn(
            "demo-sheet-popup ui-surface no-scrollbar app-safe-bottom relative max-h-[calc(100dvh-40px)] w-full max-w-[var(--shell-mobile)] overflow-y-auto overscroll-contain rounded-t-[var(--radius-sheet)] bg-surface pt-4 text-ink-900 outline-2 outline-transparent focus-visible:outline-focus-ring",
            presentation === "page" && "h-dvh max-h-dvh rounded-none pt-0",
            className,
          )}
          {...props}
        >
          {children}
          {showClose ? <Dialog.Close
              className={cn(
                "absolute z-20 flex items-center justify-center rounded-full text-ink-900 hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
                presentation === "page" ? "top-[max(16px,env(safe-area-inset-top))] left-2 size-9" : "top-4 right-4 size-11",
              )}
              aria-label={presentation === "page" ? "뒤로가기" : "닫기"}
            >
              {presentation === "page" ? <ArrowLeft aria-hidden="true" size="var(--icon-sm)" /> : <X aria-hidden="true" />}
            </Dialog.Close> : null}
        </Dialog.Popup>
      </Dialog.Viewport>
    </Dialog.Portal>
  );
}

function SheetHeader({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("space-y-1.5 px-4 pb-4 pr-16", className)} {...props} />;
}

function SheetTitle({ className, ...props }: Dialog.Title.Props) {
  return <Dialog.Title className={cn("text-ui-section leading-8 font-extrabold tracking-[var(--tracking-display)]", className)} {...props} />;
}

function SheetDescription({ className, ...props }: Dialog.Description.Props) {
  return <Dialog.Description className={cn("text-sm leading-5 text-ink-600", className)} {...props} />;
}

function SheetFooter({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("sticky bottom-0 mt-0 bg-surface px-[var(--content-gutter)] py-2.5 pb-[max(10px,env(safe-area-inset-bottom))]", className)} {...props} />;
}

export { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger };
