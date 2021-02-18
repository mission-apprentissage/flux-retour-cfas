import { anonymous, useAuthState } from "../auth";
import decodeJWT from "../utils/decodeJWT";

export default function useAuth() {
  let [auth, setAuth] = useAuthState();

  let setAuthFromToken = (access_token) => {
    if (!access_token) {
      localStorage.removeItem("flux-retour-cfas:access_token");
      setAuth(anonymous);
    } else {
      localStorage.setItem("flux-retour-cfas:access_token", access_token);
      setAuth(decodeJWT(access_token));
    }
  };

  return [auth, setAuthFromToken];
}
