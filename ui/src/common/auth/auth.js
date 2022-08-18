import { createGlobalState } from "react-hooks-global-state";

import {
  LOCAL_STORAGE_ACCESS_TOKEN,
  LOCAL_STORAGE_USER_NETWORK,
  LOCAL_STORAGE_USER_PERMISSIONS,
} from "../constants/localStorageConstants";
import decodeJWT from "../utils/decodeJWT";

const access_token = localStorage.getItem(LOCAL_STORAGE_ACCESS_TOKEN);
export const getAuthUserRole = () => localStorage.getItem(LOCAL_STORAGE_USER_PERMISSIONS);
export const getAuthUserNetwork = () => localStorage.getItem(LOCAL_STORAGE_USER_NETWORK);

const { useGlobalState, getGlobalState, setGlobalState } = createGlobalState({
  auth: access_token ? decodeJWT(access_token) : null,
});

export const getAuth = () => getGlobalState("auth");
export const useAuthState = () => useGlobalState("auth");
export const resetAuth = () => {
  localStorage.removeItem(LOCAL_STORAGE_ACCESS_TOKEN);
  localStorage.removeItem(LOCAL_STORAGE_USER_PERMISSIONS);
  localStorage.removeItem(LOCAL_STORAGE_USER_NETWORK);
  setGlobalState("auth", null);
};
