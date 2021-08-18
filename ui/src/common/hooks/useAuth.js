import { useAuthState } from "../auth";
import decodeJWT from "../utils/decodeJWT";

export default function useAuth() {
  const [auth, setAuth] = useAuthState();

  const setAuthFromToken = (access_token) => {
    if (!access_token) {
      localStorage.removeItem("tableau-de-bord:access_token");
      setAuth(null);
    } else {
      localStorage.setItem("tableau-de-bord:access_token", access_token);
      setAuth(decodeJWT(access_token));
    }
  };

  return [auth, setAuthFromToken];
}
