import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  SuccessStatusIcon as CheckCircle2,
} from "@/components/icons";

import { DemoFeedbackContext } from "@/features/scope/model/demo-feedback-context";

export function DemoFeedbackProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const notify = useCallback((nextMessage: string) => {
    setMessage(nextMessage);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setMessage(""), 2200);
  }, []);

  return (
    <DemoFeedbackContext.Provider value={notify}>
      {children}
      {message && (
        <div
          aria-live="polite"
          className="demo-toast-enter pointer-events-none fixed bottom-6 left-1/2 z-[100] flex max-w-[calc(100vw-32px)] -translate-x-1/2 items-center gap-2 rounded-full bg-ink-900 px-4 py-3 text-ui-support font-bold text-white shadow-lg"
          role="status"
        >
          <CheckCircle2 size={16} />
          <span>{message}</span>
        </div>
      )}
    </DemoFeedbackContext.Provider>
  );
}
