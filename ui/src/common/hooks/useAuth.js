import { useCallback } from "react";

import { useAuthState } from "../auth/auth";
import {
  LOCAL_STORAGE_ACCESS_TOKEN,
  LOCAL_STORAGE_USER_NETWORK,
  LOCAL_STORAGE_USER_PERMISSIONS,
} from "../constants/localStorageConstants";
import decodeJWT from "../utils/decodeJWT";

export default function useAuth() {
  const [decodedAuthToken, setAuth] = useAuthState();

  const setAuthFromToken = (access_token) => {
    const decodedAccessToken = decodeJWT(access_token);
    localStorage.setItem(LOCAL_STORAGE_ACCESS_TOKEN, access_token);
    localStorage.setItem(LOCAL_STORAGE_USER_PERMISSIONS, decodedAccessToken.permissions);
    localStorage.setItem(LOCAL_STORAGE_USER_NETWORK, decodedAccessToken.network);
    setAuth(decodedAccessToken);
  };

  const resetAuthState = useCallback(() => {
    localStorage.removeItem(LOCAL_STORAGE_ACCESS_TOKEN);
    localStorage.removeItem(LOCAL_STORAGE_USER_PERMISSIONS);
    localStorage.removeItem(LOCAL_STORAGE_USER_NETWORK);
    setAuth(null);
  }, [setAuth]);

  const isAuthTokenValid = useCallback(() => {
    if (!decodedAuthToken) return false;

    const expiryDate = new Date(decodedAuthToken.exp * 1000); // jwt expiry timestamp is in seconds, we need it in ms
    return expiryDate > new Date();
  }, [decodedAuthToken]);

  return { auth: decodedAuthToken, isAuthTokenValid, resetAuthState, setAuthFromToken };
}
