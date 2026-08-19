import { useAuth } from "@/app/_context/UserContext";

export function useCfaAdmin() {
  const { user } = useAuth();

  const isCfa = user?.organisation?.type === "ORGANISME_FORMATION";
  const isCfaAdmin = isCfa && (user?.organisation_role === "admin" || user?.impersonating === true);

  return { user, isCfaAdmin };
}
