import { createGlobalState } from "react-hooks-global-state";

import decodeJWT from "../utils/decodeJWT";

const access_token = localStorage.getItem("flux-retour-cfas:access_token");
export const getAuthUserRole = () => localStorage.getItem("flux-retour-cfas:userPermissions");
export const getAuthUserNetwork = () => localStorage.getItem("flux-retour-cfas:userNetwork");

const { useGlobalState, getGlobalState } = createGlobalState({
  auth: access_token ? decodeJWT(access_token) : null,
});

export const getAuth = () => getGlobalState("auth");
export const useAuthState = () => useGlobalState("auth");
