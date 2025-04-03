import { headers } from "next/headers";

import { AuthContext } from "@/common/internal/AuthContext";

export async function getSession(): Promise<AuthContext | null> {
  try {
    const headerStore = await headers();
    const sessionRaw = headerStore.get("x-session");

    if (!sessionRaw) {
      return null;
    }
    const decoded = atob(sessionRaw);
    return JSON.parse(decoded) as AuthContext;
  } catch (error) {
    return null;
  }
}
