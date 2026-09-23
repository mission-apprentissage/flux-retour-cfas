import { useContext } from "react";

import { IUserContext, UserContext } from "../_components/context/UserContext";

export const useAuth = (): IUserContext => useContext(UserContext) ?? {};
