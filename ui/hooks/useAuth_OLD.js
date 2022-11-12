import { useCallback } from "react";

import { useAuthState } from "../common/auth/auth";
import { LOCAL_STORAGE_ACCESS_TOKEN } from "../common/constants/localStorageConstants";
import decodeJWT from "../common/utils/decodeJWT";

export default function useAuth() {
  const [decodedAuthToken, setAuth] = useAuthState();

  const setAuthFromToken = (access_token) => {
    const decodedAccessToken = decodeJWT(access_token);
    localStorage.setItem(LOCAL_STORAGE_ACCESS_TOKEN, access_token);
    setAuth(decodedAccessToken);
  };

  const resetAuthState = useCallback(() => {
    localStorage.removeItem(LOCAL_STORAGE_ACCESS_TOKEN);
    setAuth(null);
  }, [setAuth]);

  const isAuthTokenValid = useCallback(() => {
    if (!decodedAuthToken) return false;

    const expiryDate = new Date(decodedAuthToken.exp * 1000); // jwt expiry timestamp is in seconds, we need it in ms
    return expiryDate > new Date();
  }, [decodedAuthToken]);

  return { auth: decodedAuthToken, isAuthTokenValid, resetAuthState, setAuthFromToken };
}
