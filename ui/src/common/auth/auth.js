import { createGlobalState } from "react-hooks-global-state";

import { LOCAL_STORAGE_ACCESS_TOKEN } from "../constants/localStorageConstants";
import decodeJWT from "../utils/decodeJWT";

const access_token = localStorage.getItem(LOCAL_STORAGE_ACCESS_TOKEN);

const { useGlobalState, getGlobalState, setGlobalState } = createGlobalState({
  auth: access_token ? decodeJWT(access_token) : null,
});

export const getAuth = () => getGlobalState("auth");
export const useAuthState = () => useGlobalState("auth");
export const resetAuth = () => {
  localStorage.removeItem(LOCAL_STORAGE_ACCESS_TOKEN);
  setGlobalState("auth", null);
};
