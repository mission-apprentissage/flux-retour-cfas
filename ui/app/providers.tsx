"use client";

import { QueryClientProvider } from "@tanstack/react-query";

import { MUIToasterProvider } from "@/app/_components/MUIToaster";
import { queryClient } from "@/common/queryClient";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <MUIToasterProvider>{children}</MUIToasterProvider>
    </QueryClientProvider>
  );
}
