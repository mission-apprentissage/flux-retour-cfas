import { useContext } from "react";

import { _get } from "@/common/httpClient";
import { AuthContext } from "@/common/internal/AuthContext";
import { AuthenticationContext } from "@/components/UserWrapper/UserWrapper";

export default function useAuth() {
  const { auth, setAuth } = useContext(AuthenticationContext);
  const organisationType = auth?.organisation?.type;

  async function refreshSession(): Promise<AuthContext> {
    const user = (await _get("/api/v1/session")) as AuthContext;
    setAuth(user);
    return user;
  }

  return {
    auth,
    setAuth,
    organisationType,
    refreshSession,
  };
}
