import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { ApiError } from "@/api/client";
import { AuthProvider } from "@/features/auth/model/auth-provider";

function shouldRetryQuery(failureCount: number, error: Error): boolean {
  if (failureCount >= 1) {
    return false;
  }

  if (error instanceof ApiError) {
    return error.status === 408 || error.status >= 500;
  }

  return true;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: shouldRetryQuery,
      retryDelay: (_attempt, error) => error instanceof ApiError && error.retryAfterSeconds !== null
        ? error.retryAfterSeconds * 1_000
        : 1_000,
      staleTime: 30_000,
    },
    mutations: {
      retry: false,
    },
  },
});

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}
