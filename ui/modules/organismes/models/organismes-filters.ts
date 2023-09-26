import { stripEmptyFields } from "@/common/utils/misc";

export interface OrganismesFiltersQuery {
  qualiopi: string;
  prepa_apprentissage: string;
  transmission: string;
  nature: string;
  ferme: string;
  regions?: string;
  departements?: string;
}

export interface OrganismesFilters {
  qualiopi: boolean[];
  transmission: boolean[];
  prepa_apprentissage: boolean[];
  nature: string[];
  ferme: boolean[];
  regions: string[];
  departements: string[];
}

export function parseOrganismesFiltersFromQuery(query: OrganismesFiltersQuery): OrganismesFilters {
  return {
    qualiopi: query.qualiopi?.split(",").map((item) => (item === "true" ? true : false)) ?? [],
    prepa_apprentissage: query.prepa_apprentissage?.split(",").map((item) => (item === "true" ? true : false)) ?? [],
    transmission: query.transmission?.split(",").map((item) => (item === "true" ? true : false)) ?? [],
    nature: query.nature?.split(",") ?? [],
    ferme: query.ferme?.split(",").map((item) => (item === "true" ? true : false)) ?? [],
    regions: query.regions?.split(",") ?? [],
    departements: query.departements?.split(",") ?? [],
  };
}

export function convertOrganismesFiltersToQuery(
  organismesFilters: Partial<OrganismesFilters>
): Partial<OrganismesFiltersQuery> {
  return stripEmptyFields({
    qualiopi: organismesFilters.qualiopi?.join(","),
    prepa_apprentissage: organismesFilters.prepa_apprentissage?.join(","),
    transmission: organismesFilters.transmission?.join(","),
    nature: organismesFilters.nature?.join(","),
    ferme: organismesFilters.ferme?.join(","),
    regions: organismesFilters.regions?.join(","),
    departements: organismesFilters.departements?.join(","),
  });
}
