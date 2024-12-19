import { Filter, RootFilterOperators } from "mongodb";
import { STATUT_APPRENANT } from "shared/constants";
import { z } from "zod";

export const organismeLookup = {
  from: "organismes",
  localField: "organisme_id",
  foreignField: "_id",
  as: "organisme",
};

const territoireFiltersSchema = {
  organisme_regions: z.preprocess((str: any) => str.split(","), z.array(z.string())).optional(),
  organisme_departements: z.preprocess((str: any) => str.split(","), z.array(z.string())).optional(),
  organisme_academies: z.preprocess((str: any) => str.split(","), z.array(z.string())).optional(),
  organisme_bassinsEmploi: z.preprocess((str: any) => str.split(","), z.array(z.string())).optional(),
};

export type TerritoireFilters = z.infer<z.ZodObject<typeof territoireFiltersSchema>>;

export const dateFiltersSchema = {
  date: z.preprocess((str: any) => new Date(str ?? Date.now()), z.date()),
};

export type DateFilters = z.infer<z.ZodObject<typeof dateFiltersSchema>>;

// Filtre des effectifs par territoire
export const effectifsFiltersTerritoireSchema = {
  ...territoireFiltersSchema,
  ...dateFiltersSchema,
};

export type EffectifsFiltersTerritoire = z.infer<z.ZodObject<typeof effectifsFiltersTerritoireSchema>>;

// [min, max[
const intervalParTrancheAge = {
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
  organisme_reseaux: z.preprocess((str: any) => str.split(","), z.array(z.string())).optional(),
  // apprenant_genre: z.string(),
  apprenant_tranchesAge: z
    .preprocess(
      (str: any) => str.split(","),
      z.array(z.enum(Object.keys(intervalParTrancheAge) as [string, ...string[]]))
    )
    .optional(),
  // apprenant_rqth: z.boolean().optional(),
  formation_annees: z
    .preprocess((str: any) => str.split(",").map((i) => parseInt(i, 10)), z.array(z.number()))
    .optional(),
  formation_niveaux: z.preprocess((str: any) => str.split(","), z.array(z.string())).optional(),
  formation_cfds: z.preprocess((str: any) => str.split(","), z.array(z.string())).optional(),
  formation_secteursProfessionnels: z.preprocess((str: any) => str.split(","), z.array(z.string())).optional(),
};

export type FullEffectifsFilters = z.infer<z.ZodObject<typeof fullEffectifsFiltersSchema>>;

export function combineFilters<T>(...filters: Filter<T>[]): RootFilterOperators<T> {
  const nonEmptyFilters = filters.filter((f) => Object.keys(f).length > 0);

  if (nonEmptyFilters.length === 0) return {};

  return {
    $and: nonEmptyFilters,
  };
}

export const effectifsFiltersMissionLocaleSchema = {
  statut: z.array(z.enum([STATUT_APPRENANT.ABANDON, STATUT_APPRENANT.RUPTURANT, STATUT_APPRENANT.INSCRIT]).optional()),
  rqth: z.boolean().optional(),
  mineur: z.boolean().optional(),
  niveau: z.array(z.string()).optional(),
  code_insee: z.array(z.string()).optional(),
};

export type EffectifsFiltersMissionLocale = z.infer<z.ZodObject<typeof effectifsFiltersMissionLocaleSchema>>;
