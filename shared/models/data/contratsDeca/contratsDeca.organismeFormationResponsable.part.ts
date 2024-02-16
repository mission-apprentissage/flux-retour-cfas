import { z } from "zod";

export const zContratsDecaOrganismeFormationResponsableSchema = z
  .object({
    uaiCfa: z.string().nullish().describe("L'UAI de l'organisme responsable"),
    siret: z.string().nullish().describe("Le SIRET de l'organisme responsable"),
  })
  .strict();
