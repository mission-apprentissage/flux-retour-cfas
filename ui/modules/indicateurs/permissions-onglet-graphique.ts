import { IOrganisationType } from "shared";

export function canViewOngletIndicateursVueGraphique(organisationType: IOrganisationType): boolean {
  switch (organisationType) {
    case "ORGANISME_FORMATION":
      return false;

    case "TETE_DE_RESEAU":
    case "ACADEMIE":
    case "ADMINISTRATEUR":
      return true;

    default:
      return false;
  }
}
