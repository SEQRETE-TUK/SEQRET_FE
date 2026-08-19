import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export function ErrorToast({ duration = 2500, message }: { duration?: number; message: string }) {
  const [dismissedMessage, setDismissedMessage] = useState<string | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDismissedMessage(message), duration);
    return () => window.clearTimeout(timeout);
  }, [duration, message]);

  if (dismissedMessage === message) return null;

  return createPortal(
    <div className="pointer-events-none fixed inset-x-4 bottom-[calc(10rem+env(safe-area-inset-bottom))] z-[var(--z-toast)] flex justify-center md:bottom-24">
      <p
        aria-atomic="true"
        className="demo-screen-enter w-full max-w-xs rounded-full bg-ink-900/60 px-3 py-2 text-center text-[14px] leading-5 font-normal text-white shadow-[var(--shadow-raised)] backdrop-blur-sm"
        role="alert"
      >
        {message}
      </p>
    </div>,
    document.body,
  );
}
