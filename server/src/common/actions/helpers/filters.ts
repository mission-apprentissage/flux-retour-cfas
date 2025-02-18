import { Filter, RootFilterOperators } from "mongodb";
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

export const buildSortFilter = (sort: string, order: "asc" | "desc", mapping = {}) => {
  const computedSort = mapping[sort] ?? sort;
  return {
    [computedSort]: order === "asc" ? 1 : -1,
  };
};

export const buildMineurFilter = (mineur: boolean) => {
  return mineur
    ? {
        "apprenant.date_de_naissance": { $gte: new Date(new Date().setFullYear(new Date().getFullYear() - 18)) },
      }
    : {
        "apprenant.date_de_naissance": { $lt: new Date(new Date().setFullYear(new Date().getFullYear() - 18)) },
      };
};
