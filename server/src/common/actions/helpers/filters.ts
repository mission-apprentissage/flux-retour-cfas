import { Filter, RootFilterOperators } from "mongodb";
import { z } from "zod";

import { zCommaSeparated } from "@/common/validation/commaSeparated";

export const organismeLookup = {
  from: "organismes",
  localField: "organisme_id",
  foreignField: "_id",
  as: "organisme",
};

const territoireFiltersSchema = {
  organisme_regions: zCommaSeparated(z.string()).optional(),
  organisme_departements: zCommaSeparated(z.string()).optional(),
  organisme_academies: zCommaSeparated(z.string()).optional(),
  organisme_bassinsEmploi: zCommaSeparated(z.string()).optional(),
};

export type TerritoireFilters = z.infer<z.ZodObject<typeof territoireFiltersSchema>>;

export const dateFiltersSchema = {
  date: z.preprocess((v: unknown) => (typeof v === "string" ? new Date(v) : (v ?? new Date())), z.date()),
};

export type DateFilters = z.infer<z.ZodObject<typeof dateFiltersSchema>>;

// Filtre des effectifs par territoire
export const effectifsFiltersTerritoireSchema = {
  ...territoireFiltersSchema,
  ...dateFiltersSchema,
};

export type EffectifsFiltersTerritoire = z.infer<z.ZodObject<typeof effectifsFiltersTerritoireSchema>>;

// [min, max[
export const intervalParTrancheAge: Record<string, [number, number]> = {
  "-18": [0, 18],
  "18-20": [18, 21],
  "21-25": [21, 26],
  "26+": [26, 999],
};

/**
 * Utilisé pour la recherche détaillée des indicateurs effectifs
 */
export const fullEffectifsFiltersSchema = {
  ...effectifsFiltersTerritoireSchema,
  organisme_search: z.string().optional(),
  organisme_reseaux: zCommaSeparated(z.string()).optional(),
  // apprenant_genre: z.string(),
  apprenant_tranchesAge: zCommaSeparated(
    z.enum(Object.keys(intervalParTrancheAge) as [string, ...string[]])
  ).optional(),
  // apprenant_rqth: z.boolean().optional(),
  formation_annees: z
    .preprocess(
      (v: unknown) => (typeof v === "string" ? v.split(",").map((i) => parseInt(i, 10)) : v),
      z.array(z.number())
    )
    .optional(),
  formation_niveaux: zCommaSeparated(z.string()).optional(),
  formation_cfds: zCommaSeparated(z.string()).optional(),
  formation_secteursProfessionnels: zCommaSeparated(z.string()).optional(),
};

export type FullEffectifsFilters = z.infer<z.ZodObject<typeof fullEffectifsFiltersSchema>>;

export function combineFilters<T>(...filters: Filter<T>[]): RootFilterOperators<T> {
  const nonEmptyFilters = filters.filter((f) => Object.keys(f).length > 0);

  if (nonEmptyFilters.length === 0) return {};

  return {
    $and: nonEmptyFilters,
  };
}
