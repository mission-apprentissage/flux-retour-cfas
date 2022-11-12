import { useContext } from "react";
import { AuthenticationContext } from "../components/UserWrapper/UserWrapper";

export default function useToken() {
  const { token, setToken } = useContext(AuthenticationContext);
  return [token, setToken];
}
