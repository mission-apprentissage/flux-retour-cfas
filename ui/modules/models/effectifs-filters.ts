import { stripEmptyFields } from "@/common/utils/misc";

export interface EffectifsFiltersQuery {
  date: string;
  organisme_regions?: string;
  organisme_departements?: string;
  organisme_academies?: string;
  organisme_bassinsEmploi?: string;
  organisme_reseaux?: string;
  organisme_search: string;
  apprenant_tranchesAge?: string;
  formation_annees?: string;
  formation_niveaux?: string;
  formation_cfds?: string;
  formation_secteursProfessionnels?: string;
}

export interface EffectifsFilters {
  date: Date;
  organisme_regions: string[];
  organisme_departements: string[];
  organisme_academies: string[];
  organisme_bassinsEmploi: string[];
  organisme_reseaux: string[];
  organisme_search: string;
  apprenant_tranchesAge: string[];
  formation_annees: number[];
  formation_niveaux: string[];
  formation_cfds: string[];
  formation_secteursProfessionnels: string[];
}

export function parseEffectifsFiltersFromQuery(query: EffectifsFiltersQuery): EffectifsFilters {
  return {
    date: new Date(query.date ?? Date.now()),
    organisme_regions: query.organisme_regions?.split(",") ?? [],
    organisme_departements: query.organisme_departements?.split(",") ?? [],
    organisme_academies: query.organisme_academies?.split(",") ?? [],
    organisme_bassinsEmploi: query.organisme_bassinsEmploi?.split(",") ?? [],
    organisme_reseaux: query.organisme_reseaux?.split(",") ?? [],
    organisme_search: query.organisme_search ?? "",
    apprenant_tranchesAge: query.apprenant_tranchesAge?.split(",") ?? [],
    formation_annees: query.formation_annees?.split(",").map((i) => parseInt(i, 10)) ?? [],
    formation_niveaux: query.formation_niveaux?.split(",") ?? [],
    formation_cfds: query.formation_cfds?.split(",") ?? [],
    formation_secteursProfessionnels: query.formation_secteursProfessionnels?.split(",") ?? [],
  };
}

export function convertEffectifsFiltersToQuery(
  effectifsFilters: Partial<EffectifsFilters>
): Partial<EffectifsFiltersQuery> {
  return stripEmptyFields({
    date: effectifsFilters.date?.toISOString(),
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
