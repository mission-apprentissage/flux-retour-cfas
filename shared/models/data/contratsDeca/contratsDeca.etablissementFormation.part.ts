import { z } from "zod";

export const zContratsDecaEtablissementFormationSchema = z.object({
  siret: z.string().nullish().describe("Le siret de l'établissement de la formation"),
});
