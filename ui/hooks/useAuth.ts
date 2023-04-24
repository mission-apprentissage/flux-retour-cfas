import { useContext } from "react";

import { _get } from "@/common/httpClient";
import { IAuthenticationContext } from "@/common/internal/AuthContext";
import { AuthenticationContext } from "@/components/UserWrapper/UserWrapper";

export default function useAuth() {
  // FIXME loading state ?
  const { auth, setAuth } = useContext(AuthenticationContext);
  const organisationType = auth?.organisation?.type;

  async function refreshSession(): Promise<IAuthenticationContext> {
    const user = await _get("/api/v1/session");
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
