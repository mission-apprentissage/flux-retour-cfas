import { _get } from "@/common/httpClient";
import { useContext } from "react";
import { AuthenticationContext } from "../components/UserWrapper/UserWrapper";

export default function useAuth() {
  // FIXME loading state ?
  const { auth, setAuth } = useContext(AuthenticationContext);
  const organisationType = auth?.organisation?.type;

  async function refreshSession() {
    const user = await _get("/api/v1/session");
    setAuth(user);
  }

  return {
    auth,
    setAuth,
    organisationType,
    refreshSession,
  };
}
