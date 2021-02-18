import { createGlobalState } from "react-hooks-global-state";

import { subscribeToHttpEvent } from "./httpClient";
import decodeJWT from "./utils/decodeJWT";

const anonymous = { sub: "anonymous", permissions: {} };
let access_token = localStorage.getItem("flux-retour-cfas:access_token");

const { useGlobalState, getGlobalState, setGlobalState } = createGlobalState({
  auth: access_token ? decodeJWT(access_token) : anonymous,
});

subscribeToHttpEvent("http:error", (response) => {
  if (response.status === 401) {
    //Auto logout user when token is invalid
    localStorage.removeItem("flux-retour-cfas:access_token");
    setGlobalState("auth", anonymous);
  }
});

export const getAuth = () => getGlobalState("auth");
export const useAuthState = () => useGlobalState("auth");
export { anonymous };
