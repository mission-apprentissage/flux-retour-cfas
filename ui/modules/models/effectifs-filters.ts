import { stripEmptyFields } from "@/common/utils/misc";

export interface DateFilters {
  date: Date;
}

export interface TerritoireFilters extends DateFilters {
  organisme_regions: string[];
  organisme_departements: string[];
  organisme_academies: string[];
  organisme_bassinsEmploi: string[];
}

export type QueryFilter<T> = {
  [K in keyof T]?: string | string[];
};

export interface EffectifsFiltersFull extends TerritoireFilters {
  organisme_reseaux: string[];
  organisme_search: string;
  apprenant_tranchesAge: string[];
  formation_annees: number[];
  formation_niveaux: string[];
  formation_cfds: string[];
  formation_secteursProfessionnels: string[];
}

export type EffectifsFiltersFullQuery = QueryFilter<EffectifsFiltersFull>;

function parseQueryField(value: string | string[] | undefined): string[] {
  if (value == null) return [];
  if (Array.isArray(value)) return value;
  return value.split(",");
}

export function parseQueryFieldDate(value: string | string[] | undefined): Date {
  return new Date(parseQueryField(value)[0] ?? Date.now());
}

export function parseTerritoireFiltersFromQuery(query: QueryFilter<TerritoireFilters>): TerritoireFilters {
  return {
    date: parseQueryFieldDate(query.date),
    organisme_regions: parseQueryField(query.organisme_regions),
    organisme_departements: parseQueryField(query.organisme_departements),
    organisme_academies: parseQueryField(query.organisme_academies),
    organisme_bassinsEmploi: parseQueryField(query.organisme_bassinsEmploi),
  };
}

export function parseEffectifsFiltersFullFromQuery(query: QueryFilter<EffectifsFiltersFull>): EffectifsFiltersFull {
  return {
    ...parseTerritoireFiltersFromQuery(query),
    organisme_reseaux: parseQueryField(query.organisme_reseaux),
    organisme_search: parseQueryField(query.organisme_search)[0] ?? "",
    apprenant_tranchesAge: parseQueryField(query.apprenant_tranchesAge),
    formation_annees: parseQueryField(query.formation_annees).map((i) => parseInt(i, 10)),
    formation_niveaux: parseQueryField(query.formation_niveaux),
    formation_cfds: parseQueryField(query.formation_cfds),
    formation_secteursProfessionnels: parseQueryField(query.formation_secteursProfessionnels),
  };
}

export function convertDateFiltersToQuery(date: Date | undefined | null) {
  return date?.toISOString();
}

export function convertEffectifsFiltersToQuery(
  effectifsFilters: Partial<EffectifsFiltersFull>
): Partial<QueryFilter<EffectifsFiltersFull>> {
  return stripEmptyFields({
    date: convertDateFiltersToQuery(effectifsFilters.date),
    organisme_regions: effectifsFilters.organisme_regions?.join(","),
    organisme_departements: effectifsFilters.organisme_departements?.join(","),
    organisme_academies: effectifsFilters.organisme_academies?.join(","),
    organisme_bassinsEmploi: effectifsFilters.organisme_bassinsEmploi?.join(","),
    organisme_reseaux: effectifsFilters.organisme_reseaux?.join(","),
    organisme_search: effectifsFilters.organisme_search,
    apprenant_tranchesAge: effectifsFilters.apprenant_tranchesAge?.join(","),
    formation_annees: effectifsFilters.formation_annees?.join(","),
    formation_niveaux: effectifsFilters.formation_niveaux?.join(","),
    formation_cfds: effectifsFilters.formation_cfds?.join(","),
    formation_secteursProfessionnels: effectifsFilters.formation_secteursProfessionnels?.join(","),
  });
}
