import { createGlobalState } from "react-hooks-global-state";

import decodeJWT from "../utils/decodeJWT";

const access_token = localStorage.getItem("flux-retour-cfas:access_token");
export const getAuthUserRole = () => localStorage.getItem("flux-retour-cfas:userPermissions");
export const getAuthUserNetwork = () => localStorage.getItem("flux-retour-cfas:userNetwork");

const { useGlobalState, getGlobalState, setGlobalState } = createGlobalState({
  auth: access_token ? decodeJWT(access_token) : null,
});

export const getAuth = () => getGlobalState("auth");
export const useAuthState = () => useGlobalState("auth");
export const resetAuth = () => {
  localStorage.removeItem("flux-retour-cfas:access_token");
  localStorage.removeItem("flux-retour-cfas:userPermissions");
  localStorage.removeItem("flux-retour-cfas:userNetwork");
  setGlobalState("auth", null);
};
