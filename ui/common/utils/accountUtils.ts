import { DEPARTEMENTS_BY_CODE, IRegionCode, REGIONS_BY_CODE, TYPES_ORGANISATION } from "shared";

import { AuthContext } from "../internal/AuthContext";

export function getAccountLabel(auth: AuthContext): string {
  if (auth.organisation.type !== "ADMINISTRATEUR" && !auth.impersonating) {
    return "Mon compte";
  }
  const typeItem = TYPES_ORGANISATION.find((t) => t.key === auth.organisation.type);
  if (!typeItem) {
    return auth.organisation.type;
  }
  switch (auth.organisation.type) {
    case "TETE_DE_RESEAU":
      return `${typeItem.nom} ${auth.organisation.reseau}`;
    case "MISSION_LOCALE":
    case "ARML":
      return auth.organisation.nom ? `${typeItem.nom} ${auth.organisation.nom}` : typeItem.nom;
    case "ORGANISME_FORMATION":
    case "OPERATEUR_PUBLIC_NATIONAL":
    case "ADMINISTRATEUR":
      return typeItem.nom;
    case "DREETS":
    case "DRAAF":
    case "DRAFPIC":
    case "CONSEIL_REGIONAL":
    case "CARIF_OREF_REGIONAL":
    case "ACADEMIE": {
      const codeRegion =
        "code_region" in auth.organisation
          ? auth.organisation.code_region
          : "code_academie" in auth.organisation
            ? auth.organisation.code_academie
            : undefined;
      return `${typeItem.nom} ${codeRegion ? REGIONS_BY_CODE[codeRegion as IRegionCode]?.nom || codeRegion : ""}`;
    }
    case "DDETS":
      return `${typeItem.nom} ${
        DEPARTEMENTS_BY_CODE[auth.organisation.code_departement as IRegionCode]?.nom ||
        auth.organisation.code_departement
      }`;
    default:
      return typeItem.nom;
  }
}
