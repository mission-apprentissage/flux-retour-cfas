import { IOrganisationType } from "shared";

// Titre de la liste des organismes, partagé entre le h1 de la page et le <title> du document.
export function getOrganismesListTitle(type?: IOrganisationType | string) {
  switch (type) {
    case "ORGANISME_FORMATION":
      return "Mes organismes";
    case "TETE_DE_RESEAU":
      return "Les organismes de mon réseau";
    case "DREETS":
    case "DDETS":
    case "ACADEMIE":
      return "Les organismes de mon territoire";
    case "ADMINISTRATEUR":
      return "Tous les organismes";
    default:
      return "Mes organismes";
  }
}
