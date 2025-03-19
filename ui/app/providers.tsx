"use client";

import { QueryClientProvider } from "@tanstack/react-query";

import { queryClient } from "@/common/queryClient";

import { ErrorBoundary } from "./_components/ErrorBoundary";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>{children}</ErrorBoundary>
    </QueryClientProvider>
  );
}
