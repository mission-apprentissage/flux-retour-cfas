import { useAuth } from "@/app/_context/UserContext";
import { isCfaWithMlBeta as checkCfaWithMlBeta } from "@/common/utils/cfaUtils";

export function useCfaAdmin() {
  const { user } = useAuth();

  const isCfaV2 = checkCfaWithMlBeta(user?.organisation);
  const isCfaAdmin = isCfaV2 && (user?.organisation_role === "admin" || user?.impersonating === true);

  return { user, isCfaV2, isCfaAdmin };
}
