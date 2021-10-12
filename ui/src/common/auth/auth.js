import { createGlobalState } from "react-hooks-global-state";

import { subscribeToHttpEvent } from "../httpClient";
import decodeJWT from "../utils/decodeJWT";

const access_token = localStorage.getItem("flux-retour-cfas:access_token");

const { useGlobalState, getGlobalState, setGlobalState } = createGlobalState({
  auth: access_token ? decodeJWT(access_token) : null,
});

subscribeToHttpEvent("http:error", (response) => {
  if (response.status === 401) {
    //Auto logout user when token is invalid
    localStorage.removeItem("flux-retour-cfas:access_token");
    setGlobalState("auth", null);
  }
});

export const getAuth = () => getGlobalState("auth");
export const useAuthState = () => useGlobalState("auth");
