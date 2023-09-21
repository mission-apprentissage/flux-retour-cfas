import { OrganisationType } from "@/common/internal/Organisation";

export function canViewOngletIndicateursVueGraphique(organisationType: OrganisationType): boolean {
  switch (organisationType) {
    case "ORGANISME_FORMATION":
    case "TETE_DE_RESEAU":
      return false;

    case "DREETS":
    case "DRAAF":
    case "DDETS":
    case "CONSEIL_REGIONAL":
    case "CARIF_OREF_REGIONAL":
    case "ACADEMIE":
    case "OPERATEUR_PUBLIC_NATIONAL":
    case "CARIF_OREF_NATIONAL":
    case "ADMINISTRATEUR":
      return true;
  }
}
