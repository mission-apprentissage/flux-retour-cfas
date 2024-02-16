import { z } from "zod";

export const zContratsDecaDetailsContratSchema = z.object({
  noContrat: z.string().describe("Le numéro du contrat"),
  dateDebutContrat: z.string().describe("La date de début du contrat"),
  statut: z.string().describe("Le statut du contrat"),
  dateFinContrat: z.string().describe("La date de fin du contrat"),
  dateEffetAvenant: z.string().nullish().describe("La date d'effet de l'avenant du contrat"),
  noAvenant: z.string().nullish().describe("Le numéro de l'avenant du contrat"),
});
