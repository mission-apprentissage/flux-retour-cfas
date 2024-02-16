import { z } from "zod";

export const zContratsDecaRuptureSchema = z.object({
  dateEffetRupture: z.string().optional().describe("La date d'effet de la rupture"),
});
