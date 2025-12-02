import { useMemo } from "react";
import { getRegionsFromOrganisation, OrganisationWithRegions } from "shared/utils/organisationRegions";

import { useAuth } from "@/app/_context/UserContext";

export function useUserRegions() {
  const { user } = useAuth();

  const result = useMemo(() => {
    if (!user?.organisation) {
      return {
        regions: [] as string[],
        isLoading: true,
        isMultiRegion: false,
      };
    }

    const regions = getRegionsFromOrganisation(user.organisation as OrganisationWithRegions);

    return {
      regions,
      isLoading: false,
      isMultiRegion: regions.length > 1,
    };
  }, [user?.organisation]);

  return result;
}
