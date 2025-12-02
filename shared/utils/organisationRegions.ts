import { ORGANISATION_TYPE } from "../constants";
import { DEPARTEMENTS_BY_CODE } from "../constants/territoires";

export interface OrganisationWithRegions {
  type: string;
  region_list?: string[];
  code_region?: string;
  code_departement?: string;
}

export function getRegionsFromOrganisation(organisation: OrganisationWithRegions): string[] {
  switch (organisation.type) {
    case ORGANISATION_TYPE.ARML:
      return organisation.region_list || [];
    case ORGANISATION_TYPE.DREETS:
      return organisation.code_region ? [organisation.code_region] : [];
    case ORGANISATION_TYPE.DDETS: {
      if (!organisation.code_departement) return [];
      const departement = DEPARTEMENTS_BY_CODE[organisation.code_departement as keyof typeof DEPARTEMENTS_BY_CODE];
      if (!departement) return [];
      return [departement.region.code];
    }
    case ORGANISATION_TYPE.ADMINISTRATEUR:
      return [];
    default:
      return [];
  }
}
