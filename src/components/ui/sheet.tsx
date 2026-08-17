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

function SheetContent({ className, children, presentation = "sheet", ...props }: Dialog.Popup.Props & { presentation?: "sheet" | "page" }) {
  return (
    <Dialog.Portal>
      <Dialog.Backdrop className="demo-sheet-backdrop fixed inset-0 z-[var(--z-modal)] bg-[var(--color-overlay)]" />
      <Dialog.Viewport className="fixed inset-0 z-[var(--z-modal)] flex items-end justify-center">
        <Dialog.Popup
          data-presentation={presentation}
          className={cn(
            "demo-sheet-popup no-scrollbar app-safe-bottom relative max-h-[calc(100dvh-40px)] w-full max-w-[var(--shell-mobile)] overflow-y-auto overscroll-contain rounded-t-[var(--radius-sheet)] bg-surface pt-4 text-ink-900 outline-2 outline-transparent focus-visible:outline-focus-ring",
            presentation === "page" && "h-dvh max-h-dvh rounded-none pt-0",
            className,
          )}
          {...props}
        >
          {presentation === "sheet" ? <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line md:hidden" aria-hidden="true" /> : null}
          {children}
          <Dialog.Close
            className={cn(
              "absolute z-20 flex size-11 items-center justify-center rounded-full text-ink-600 hover:bg-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
              presentation === "page" ? "top-[max(10px,env(safe-area-inset-top))] left-2" : "top-4 right-4",
            )}
            aria-label={presentation === "page" ? "뒤로가기" : "닫기"}
          >
            {presentation === "page" ? <ArrowLeft aria-hidden="true" /> : <X aria-hidden="true" />}
          </Dialog.Close>
        </Dialog.Popup>
      </Dialog.Viewport>
    </Dialog.Portal>
  );
}

function SheetHeader({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("space-y-1.5 px-4 pb-4 pr-16", className)} {...props} />;
}

function SheetTitle({ className, ...props }: Dialog.Title.Props) {
  return <Dialog.Title className={cn("text-[22px] leading-[30px] font-extrabold tracking-[-0.5px]", className)} {...props} />;
}

function SheetDescription({ className, ...props }: Dialog.Description.Props) {
  return <Dialog.Description className={cn("text-sm leading-5 text-ink-600", className)} {...props} />;
}

function SheetFooter({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("sticky bottom-0 mt-4 border-t border-line bg-surface p-4 pb-[max(16px,env(safe-area-inset-bottom))]", className)} {...props} />;
}

export { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger };
