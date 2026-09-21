import { redirect } from "next/navigation";
import { getRegionsFromOrganisation, type OrganisationWithRegions } from "shared/utils/organisationRegions";

import { getSession } from "@/app/_utils/session.utils";

import { ADMIN_DEFAULT_REGION_CODE, isAdminUser } from "../access";

export default async function RegionMLPage() {
  const user = await getSession();
  const regions = user?.organisation ? getRegionsFromOrganisation(user.organisation as OrganisationWithRegions) : [];
  const defaultRegionCode = isAdminUser(user) ? ADMIN_DEFAULT_REGION_CODE : regions[0];

  if (!defaultRegionCode) {
    return <p>Aucune région disponible.</p>;
  }

  redirect(`/suivi-des-indicateurs/region/${defaultRegionCode}`);
}
