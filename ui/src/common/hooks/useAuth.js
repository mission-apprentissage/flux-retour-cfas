import { useAuthState } from "../auth/auth";
import decodeJWT from "../utils/decodeJWT";

export default function useAuth() {
  const [auth, setAuth] = useAuthState();

  const setAuthFromToken = (access_token) => {
    if (!access_token) {
      localStorage.removeItem("flux-retour-cfas:access_token");
      setAuth(null);
    } else {
      localStorage.setItem("flux-retour-cfas:access_token", access_token);
      const decodedAccessToken = decodeJWT(access_token);
      localStorage.setItem("flux-retour-cfas:userPermissions", decodedAccessToken.permissions);
      localStorage.setItem("flux-retour-cfas:userNetwork", decodedAccessToken.network);
      setAuth(decodedAccessToken);
    }
  };

  return [auth, setAuthFromToken];
}
