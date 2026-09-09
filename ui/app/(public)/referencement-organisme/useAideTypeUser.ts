"use client";

import { useAuth } from "@/app/_context/UserContext";

export function useAideTypeUser(): string {
  const { user } = useAuth();

  return user?.organisation?.type ?? "public";
}
