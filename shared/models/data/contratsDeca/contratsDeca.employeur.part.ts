import { z } from "zod";

export const zContratsDecaEmployeurSchema = z.object({
  codeIdcc: z.string().describe("Le code IDCC de l'employeur"),
});
