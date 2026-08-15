import { useEffect, useState } from "react";

import { ApiError } from "@/api/client";

export function useRetryAfter(error: unknown): number {
  const [deadline, setDeadline] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let interval: number | undefined;
    const reset = window.setTimeout(() => {
      if (error instanceof ApiError && error.status === 429) {
        const nextDeadline = Date.now() + Math.max(1, error.retryAfterSeconds ?? 1) * 1_000;
        setDeadline(nextDeadline);
        setNow(Date.now());
        interval = window.setInterval(() => setNow(Date.now()), 1_000);
      } else {
        setDeadline(0);
      }
    }, 0);
    return () => {
      window.clearTimeout(reset);
      if (interval !== undefined) window.clearInterval(interval);
    };
  }, [error]);

  return Math.max(0, Math.ceil((deadline - now) / 1_000));
}
