import { z } from "zod";

export const zContratsDecaFormationSchema = z
  .object({
    dateDebutFormation: z.string().describe("La date de début de la formation"),
    dateFinFormation: z.string().describe("La date de fin de la formation"),
    codeDiplome: z.string().describe("Le code diplôme de la formation"),
    rncp: z.string().nullish().describe("Le code RNCP de la formation"),
    intituleOuQualification: z.string().nullish().describe("L'adresse email de l'alternant"),
  })
  .strict();
