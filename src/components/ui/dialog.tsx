import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { XIcon as X } from "@phosphor-icons/react";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;

function DialogContent({ className, children, showClose = true, ...props }: DialogPrimitive.Popup.Props & { showClose?: boolean }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop className="demo-dialog-backdrop fixed inset-0 z-[var(--z-modal)] bg-[var(--color-overlay)]" />
      <DialogPrimitive.Viewport className="fixed inset-0 z-[var(--z-modal)] grid place-items-center overflow-y-auto p-4 sm:p-6">
        <DialogPrimitive.Popup
          className={cn(
            "demo-dialog-popup ui-surface relative max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-[var(--radius-card)] bg-surface p-6 text-ink-900 outline-2 outline-transparent focus-visible:outline-focus-ring sm:max-h-[calc(100dvh-3rem)]",
            className,
          )}
          {...props}
        >
          {children}
          {showClose ? <DialogPrimitive.Close aria-label="닫기" className="absolute right-4 top-4 flex size-11 items-center justify-center rounded-full text-ink-600 hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"><X aria-hidden="true" /></DialogPrimitive.Close> : null}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Viewport>
    </DialogPrimitive.Portal>
  );
}

function DialogHeader({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("space-y-1.5 pr-10", className)} {...props} />;
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return <DialogPrimitive.Title className={cn("text-ui-section leading-8 font-extrabold tracking-[var(--tracking-display)]", className)} {...props} />;
}

function DialogDescription({ className, ...props }: DialogPrimitive.Description.Props) {
  return <DialogPrimitive.Description className={cn("text-sm leading-5 text-ink-600", className)} {...props} />;
}

function DialogFooter({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...props} />;
}

export { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle };
