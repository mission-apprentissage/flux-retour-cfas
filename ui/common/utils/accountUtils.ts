import {
  DEPARTEMENTS_BY_CODE,
  getAcademieByCode,
  IOrganisationOperateurPublicAcademieJson,
  IRegionCode,
  TYPES_ORGANISATION,
} from "shared";

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
    case "ADMINISTRATEUR":
      return typeItem.nom;
    case "DREETS":
    case "CONSEIL_REGIONAL":
    case "ACADEMIE": {
      const codeAcademie = (auth.organisation as IOrganisationOperateurPublicAcademieJson).code_academie;
      return `${typeItem.nom} ${codeAcademie ? getAcademieByCode(codeAcademie)?.nom : ""}`;
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
