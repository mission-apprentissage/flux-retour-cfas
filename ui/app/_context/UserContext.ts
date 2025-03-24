import { useContext } from "react";

import { UserContext } from "../_components/context/UserContext";

export const useAuth = () => useContext(UserContext) ?? {};
