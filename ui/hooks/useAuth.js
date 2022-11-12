import { useContext } from "react";
import { AuthenticationContext } from "../components/UserWrapper/UserWrapper";

export default function useAuth() {
  const { auth, setAuth } = useContext(AuthenticationContext);
  return [auth, setAuth];
}
