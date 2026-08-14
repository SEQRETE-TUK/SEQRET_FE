import { QueryClient } from "@tanstack/react-query";

import { ApiError } from "@/lib/api-client";

function shouldRetryQuery(failureCount: number, error: Error): boolean {
  if (failureCount >= 1) {
    return false;
  }

  if (error instanceof ApiError) {
    return error.status === 408 || error.status === 429 || error.status >= 500;
  }

  return true;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    mutations: {
      retry: false,
    },
    queries: {
      refetchOnWindowFocus: false,
      retry: shouldRetryQuery,
    },
  },
});
