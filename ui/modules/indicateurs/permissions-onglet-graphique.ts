import { IOrganisationType } from "shared";

export function canViewOngletIndicateursVueGraphique(organisationType: IOrganisationType): boolean {
  switch (organisationType) {
    case "ORGANISME_FORMATION":
      return false;

    case "TETE_DE_RESEAU":
    case "DRAAF":
    case "CONSEIL_REGIONAL":
    case "CARIF_OREF_REGIONAL":
    case "DRAFPIC":
    case "ACADEMIE":
    case "CARIF_OREF_NATIONAL":
    case "ADMINISTRATEUR":
      return true;

    default:
      return false;
  }
}
