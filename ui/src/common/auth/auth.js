import { createGlobalState } from "react-hooks-global-state";

import {
  LOCAL_STORAGE_ACCESS_TOKEN,
  LOCAL_STORAGE_USER_NOM_ETABLISSEMENT,
  LOCAL_STORAGE_USER_ROLE,
} from "../constants/localStorageConstants";
import decodeJWT from "../utils/decodeJWT";

const access_token = localStorage.getItem(LOCAL_STORAGE_ACCESS_TOKEN);

const { useGlobalState, getGlobalState, setGlobalState } = createGlobalState({
  auth: access_token ? decodeJWT(access_token) : null,
});

export const getAuth = () => getGlobalState("auth");
export const useAuthState = () => useGlobalState("auth");
export const getAuthUserRole = () => localStorage.getItem(LOCAL_STORAGE_USER_ROLE);
export const getAuthUserNomEtablissement = () => localStorage.getItem(LOCAL_STORAGE_USER_NOM_ETABLISSEMENT);
export const resetAuth = () => {
  localStorage.removeItem(LOCAL_STORAGE_ACCESS_TOKEN);
  localStorage.removeItem(LOCAL_STORAGE_USER_ROLE);
  localStorage.removeItem(LOCAL_STORAGE_USER_NOM_ETABLISSEMENT);
  setGlobalState("auth", null);
};
