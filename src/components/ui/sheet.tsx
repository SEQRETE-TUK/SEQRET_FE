import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

const Sheet = Dialog.Root;
const SheetTrigger = Dialog.Trigger;
const SheetClose = Dialog.Close;

function SheetContent({ className, children, ...props }: Dialog.Popup.Props) {
  return (
    <Dialog.Portal>
      <Dialog.Backdrop className="demo-sheet-backdrop fixed inset-0 z-[var(--z-modal)] bg-ink-900/35" />
      <Dialog.Viewport className="fixed inset-0 z-[var(--z-modal)] flex items-end justify-center">
        <Dialog.Popup
          className={cn(
            "demo-sheet-popup relative max-h-[calc(100dvh-96px)] w-full max-w-[440px] overflow-y-auto rounded-t-[var(--radius-sheet)] bg-white pt-5 text-ink-900 outline-none",
            className,
          )}
          {...props}
        >
          <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-line" aria-hidden="true" />
          {children}
          <Dialog.Close
            className="absolute top-5 right-5 flex size-11 items-center justify-center rounded-full text-ink-600 hover:bg-canvas focus-visible:outline-3 focus-visible:outline-primary-400"
            aria-label="닫기"
          >
            <X aria-hidden="true" />
          </Dialog.Close>
        </Dialog.Popup>
      </Dialog.Viewport>
    </Dialog.Portal>
  );
}

function SheetHeader({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("space-y-1.5 px-5 pb-4 pr-16", className)} {...props} />;
}

function SheetTitle({ className, ...props }: Dialog.Title.Props) {
  return <Dialog.Title className={cn("text-[22px] leading-[30px] font-extrabold tracking-[-0.5px]", className)} {...props} />;
}

function SheetDescription({ className, ...props }: Dialog.Description.Props) {
  return <Dialog.Description className={cn("text-[13px] leading-[19px] text-ink-400", className)} {...props} />;
}

function SheetFooter({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("sticky bottom-0 mt-4 border-t border-line bg-white p-5 pb-[max(20px,env(safe-area-inset-bottom))]", className)} {...props} />;
}

export { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger };
