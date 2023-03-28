import { useContext } from "react";
import { AuthenticationContext } from "../components/UserWrapper/UserWrapper";

export default function useAuth() {
  // FIXME loading state ?
  const { auth, setAuth } = useContext(AuthenticationContext);
  const organisationType = auth?.organisation?.type;
  return { auth, setAuth, organisationType };
}
