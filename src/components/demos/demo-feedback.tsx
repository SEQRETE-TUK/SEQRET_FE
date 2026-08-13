"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";

type DemoFeedbackContextValue = (message: string) => void;

const DemoFeedbackContext = createContext<DemoFeedbackContextValue>(() => undefined);

export function DemoFeedbackProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
          className="demo-toast-enter pointer-events-none fixed bottom-6 left-1/2 z-[100] flex max-w-[calc(100vw-32px)] -translate-x-1/2 items-center gap-2 rounded-full bg-[#191927] px-4 py-3 text-[12px] font-bold text-white shadow-lg"
          role="status"
        >
          <CheckCircle2 size={16} />
          <span>{message}</span>
        </div>
      )}
    </DemoFeedbackContext.Provider>
  );
}

export function useDemoFeedback() {
  return useContext(DemoFeedbackContext);
}
