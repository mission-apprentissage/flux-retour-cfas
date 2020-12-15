import { anonymous, useAuthState } from "../auth";
import decodeJWT from "../utils/decodeJWT";

export default function useAuth() {
  let [auth, setAuth] = useAuthState();

  let setAuthFromToken = (token) => {
    if (!token) {
      sessionStorage.removeItem("flux-retour-cfas:token");
      setAuth(anonymous);
    } else {
      sessionStorage.setItem("flux-retour-cfas:token", token);
      setAuth(decodeJWT(token));
    }
  };

  return [auth, setAuthFromToken];
}
