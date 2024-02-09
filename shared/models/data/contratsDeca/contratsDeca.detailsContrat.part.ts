import { object, string, stringOrNull } from "shared";

export const contratsDecaDetailsContratSchema = object(
  {
    noContrat: string({ description: "Le numéro du contrat" }),
    dateDebutContrat: string({ description: "La date de début du contrat" }),
    dateFinContrat: string({ description: "La date de fin du contrat" }),
    statut: string({ description: "Le statut du contrat" }),
    dateEffetAvenant: stringOrNull({ description: "La date d'effet de l'avenant du contrat" }),
    noAvenant: stringOrNull({ description: "Le numéro de l'avenant du contrat" }),
  },
  {
    required: ["noContrat", "dateDebutContrat", "statut", "dateFinContrat"],
  }
);
