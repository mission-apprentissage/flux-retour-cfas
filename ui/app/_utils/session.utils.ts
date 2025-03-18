import { headers } from "next/headers";

import { AuthContext } from "@/common/internal/AuthContext";

export async function getSession(): Promise<AuthContext | Record<string, never>> {
  try {
    const headerStore = await headers();
    const sessionRaw = headerStore.get("x-session");

    if (!sessionRaw) {
      return {};
    }

    return JSON.parse(sessionRaw) as AuthContext;
  } catch (error) {
    return {};
  }
}
