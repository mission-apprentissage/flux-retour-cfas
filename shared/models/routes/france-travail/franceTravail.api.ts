import { z } from "zod";

export const franceTravailEffectifsSortSchema = z
  .enum(["jours_sans_contrat", "nom", "organisme"])
  .default("jours_sans_contrat");

export const franceTravailEffectifsSortOrderSchema = z.enum(["asc", "desc"]).default("desc");

export const franceTravailEffectifsQuerySchema = z.object({
  page: z.coerce.number().positive().max(10000).default(1),
  limit: z.coerce.number().positive().min(1).max(100).default(20),
  search: z.string().optional(),
  sort: franceTravailEffectifsSortSchema,
  order: franceTravailEffectifsSortOrderSchema,
});

export type IFranceTravailEffectifsQuery = z.infer<typeof franceTravailEffectifsQuerySchema>;
