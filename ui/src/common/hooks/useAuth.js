import { useCallback } from "react";

import { useAuthState } from "../auth/auth";
import {
  LOCAL_STORAGE_ACCESS_TOKEN,
  LOCAL_STORAGE_USER_ADRESSE,
  LOCAL_STORAGE_USER_NOM_ETABLISSEMENT,
  LOCAL_STORAGE_USER_OUTILS_GESTION,
  LOCAL_STORAGE_USER_ROLE,
  LOCAL_STORAGE_USER_SIRET,
  LOCAL_STORAGE_USER_UAI,
} from "../constants/localStorageConstants";
import decodeJWT from "../utils/decodeJWT";

export default function useAuth() {
  const [decodedAuthToken, setAuth] = useAuthState();

  const setAuthFromToken = (access_token) => {
    if (!access_token) {
      localStorage.removeItem(LOCAL_STORAGE_ACCESS_TOKEN);
      setAuth(null);
    } else {
      localStorage.setItem(LOCAL_STORAGE_ACCESS_TOKEN, access_token);
      const decodedAccessToken = decodeJWT(access_token);
      localStorage.setItem(LOCAL_STORAGE_USER_ROLE, decodedAccessToken.role);
      localStorage.setItem(LOCAL_STORAGE_USER_NOM_ETABLISSEMENT, decodedAccessToken.nom_etablissement);
      localStorage.setItem(LOCAL_STORAGE_USER_UAI, decodedAccessToken.uai);
      localStorage.setItem(LOCAL_STORAGE_USER_SIRET, decodedAccessToken.siret);
      localStorage.setItem(LOCAL_STORAGE_USER_ADRESSE, decodedAccessToken.adresse_etablissement);
      localStorage.setItem(LOCAL_STORAGE_USER_OUTILS_GESTION, decodedAccessToken.outils_gestion);
      setAuth(decodedAccessToken);
    }
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
