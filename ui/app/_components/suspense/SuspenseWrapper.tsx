"use client";

import { ReactNode, Suspense } from "react";

interface SuspenseWrapperProps {
  children: ReactNode;
  fallback: ReactNode;
  errorFallback?: ReactNode;
}

export function SuspenseWrapper({ children, fallback }: SuspenseWrapperProps) {
  return <Suspense fallback={fallback}>{children}</Suspense>;
}
