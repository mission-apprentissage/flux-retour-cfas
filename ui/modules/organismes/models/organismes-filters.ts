import { stripEmptyFields } from "@/common/utils/misc";

export interface OrganismesFiltersQuery {
  qualiopi: string;
  prepa_apprentissage: string;
  transmission: string;
  nature: string;
  ferme: string;
}

export interface OrganismesFilters {
  qualiopi: boolean[];
  transmission: boolean[];
  prepa_apprentissage: boolean[];
  nature: string[];
  ferme: boolean[];
}

export function parseOrganismesFiltersFromQuery(query: OrganismesFiltersQuery): OrganismesFilters {
  return {
    qualiopi: query.qualiopi?.split(",").map((item) => (item === "true" ? true : false)) ?? [true, false],
    prepa_apprentissage: query.prepa_apprentissage?.split(",").map((item) => (item === "true" ? true : false)) ?? [
      true,
      false,
    ],
    transmission: query.transmission?.split(",").map((item) => (item === "true" ? true : false)) ?? [true, false],
    nature: query.nature?.split(",") ?? ["responsable", "formateur", "responsable_formateur"],
    ferme: query.ferme?.split(",").map((item) => (item === "true" ? true : false)) ?? [true, false],
  };
}

export function convertOrganismesFiltersToQuery(
  organismesFilters: Partial<OrganismesFilters>
): Partial<OrganismesFiltersQuery> {
  return stripEmptyFields({
    // qualiopi: organismesFilters.qualiopi?.join(","),
    // prepa_apprentissage: organismesFilters.prepa_apprentissage?.join(","),
    // transmission: organismesFilters.transmission?.join(","),
    nature: organismesFilters.nature?.join(","),
    ferme: organismesFilters.ferme?.join(","),
  });
}
