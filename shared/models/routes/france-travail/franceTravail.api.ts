import { z } from "zod";

import { zApiEffectifListeEnum } from "../../data/missionLocaleEffectif.model";

export const codeRomeSchema = z.string().regex(/^[A-Z]\d{4}$/, "Invalid ROME code format: expected [A-Z][0-9]{4}");

export const codeSecteurSchema = z.coerce.number().positive();

export const franceTravailEffectifsSortSchema = z.enum(["jours_sans_contrat", "nom", "organisme"]).optional();

export const franceTravailEffectifsSortOrderSchema = z.enum(["asc", "desc"]).default("desc");

export const franceTravailEffectifsQuerySchema = z.object({
  page: z.coerce.number().positive().max(10000).default(1),
  limit: z.coerce.number().positive().min(1).max(100).default(20),
  search: z.string().optional(),
  sort: franceTravailEffectifsSortSchema,
  order: franceTravailEffectifsSortOrderSchema,
});

export type IFranceTravailEffectifsQuery = z.infer<typeof franceTravailEffectifsQuerySchema>;

export const effectifFranceTravailQuerySchema = z.object({
  nom_liste: zApiEffectifListeEnum,
  code_secteur: codeSecteurSchema.optional(),
  search: z.string().optional(),
  sort: franceTravailEffectifsSortSchema,
  order: franceTravailEffectifsSortOrderSchema,
});

export type IEffectifFranceTravailQuery = z.infer<typeof effectifFranceTravailQuerySchema>;

export const franceTravailEffectifsTraitesMoisQuerySchema = z.object({
  page: z.coerce.number().positive().max(10000).default(1),
  limit: z.coerce.number().positive().min(1).max(100).default(20),
  search: z.string().optional(),
  sort: franceTravailEffectifsSortSchema,
  order: franceTravailEffectifsSortOrderSchema,
  mois: z.string().regex(/^\d{4}-\d{2}$/, "Invalid month format: expected YYYY-MM"),
});

export type IFranceTravailEffectifsTraitesMoisQuery = z.infer<typeof franceTravailEffectifsTraitesMoisQuerySchema>;
