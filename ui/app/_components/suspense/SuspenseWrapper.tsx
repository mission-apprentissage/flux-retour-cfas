"use client";

import { ReactNode, Suspense } from "react";

import { ErrorBoundary } from "@/app/_components/ErrorBoundary";

interface SuspenseWrapperProps {
  children: ReactNode;
  fallback: ReactNode;
  errorFallback?: ReactNode;
}

export function SuspenseWrapper({ children, fallback, errorFallback }: SuspenseWrapperProps) {
  return (
    <ErrorBoundary fallback={errorFallback}>
      <Suspense fallback={fallback}>{children}</Suspense>
    </ErrorBoundary>
  );
}
