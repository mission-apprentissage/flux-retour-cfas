import { Organisme } from "@/common/internal/Organisme";
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

export function filterOrganismesArrayFromOrganismesFilters(
  organismesList: Organisme[] | undefined,
  organismesFilters: Partial<OrganismesFilters>
): Organisme[] | undefined {
  let filteredOrganismes = organismesList;

  if (!organismesList) return undefined;

  if (organismesFilters.qualiopi?.length && organismesFilters.qualiopi?.length > 0)
    filteredOrganismes = filteredOrganismes?.filter((item) => organismesFilters.qualiopi?.includes(item.qualiopi));

  if (organismesFilters.prepa_apprentissage?.length && organismesFilters.prepa_apprentissage?.length > 0)
    filteredOrganismes = filteredOrganismes?.filter(
      (item) => organismesFilters.prepa_apprentissage?.includes(item.prepa_apprentissage)
    );

  if (organismesFilters.ferme?.length && organismesFilters.ferme?.length > 0)
    filteredOrganismes = filteredOrganismes?.filter((item) => organismesFilters.ferme?.includes(item.ferme));

  if (organismesFilters.nature?.length && organismesFilters.nature?.length > 0)
    filteredOrganismes = filteredOrganismes?.filter((item) => organismesFilters.nature?.includes(item.nature));

  if (organismesFilters.regions?.length && organismesFilters.regions?.length > 0)
    filteredOrganismes = filteredOrganismes?.filter((item) => {
      if (item.adresse?.region && organismesFilters.regions)
        return organismesFilters.regions?.includes(item.adresse.region);
    });

  if (organismesFilters.departements?.length && organismesFilters.departements?.length > 0)
    filteredOrganismes = filteredOrganismes?.filter((item) => {
      if (item.adresse?.departement && organismesFilters.departements)
        return organismesFilters.departements?.includes(item.adresse.departement);
    });

  if (organismesFilters.transmission?.length && organismesFilters.transmission?.length === 1)
    filteredOrganismes = filteredOrganismes?.filter((item) => {
      if (organismesFilters.transmission?.[0] === true) return item.last_transmission_date;
      if (organismesFilters.transmission?.[0] === false) return !item.last_transmission_date;
    });

  return filteredOrganismes;
}
