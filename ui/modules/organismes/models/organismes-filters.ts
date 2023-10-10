import { stripEmptyFields } from "@/common/utils/misc";

import { OrganismeNormalized } from "../ListeOrganismesPage";

export interface OrganismesFiltersQuery {
  qualiopi: string;
  prepa_apprentissage: string;
  transmission: string;
  nature: string;
  ferme: string;
  regions?: string;
  departements?: string;
  etatUAI: string;
}

export interface OrganismesFilters {
  qualiopi: boolean[];
  transmission: boolean[];
  prepa_apprentissage: boolean[];
  nature: string[];
  ferme: boolean[];
  regions: string[];
  departements: string[];
  etatUAI: boolean[];
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
    etatUAI: query.etatUAI?.split(",").map((item) => (item === "true" ? true : false)) ?? [],
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
    etatUAI: organismesFilters.etatUAI?.join(","),
  });
}

export function filterOrganismesArrayFromOrganismesFilters(
  organismesList: OrganismeNormalized[],
  organismesFilters: Partial<OrganismesFilters>
): OrganismeNormalized[] {
  let filteredOrganismes = organismesList;

  if (organismesFilters.qualiopi?.length && organismesFilters.qualiopi?.length > 0) {
    filteredOrganismes = filteredOrganismes?.filter((item) => {
      if (item.qualiopi !== undefined) return organismesFilters.qualiopi?.includes(item.qualiopi);
    });
  }

  if (organismesFilters.prepa_apprentissage?.length && organismesFilters.prepa_apprentissage?.length > 0)
    filteredOrganismes = filteredOrganismes?.filter((item) => {
      if (item.prepa_apprentissage !== undefined)
        return organismesFilters.prepa_apprentissage?.includes(item.prepa_apprentissage);
    });

  if (organismesFilters.ferme?.length && organismesFilters.ferme?.length > 0)
    filteredOrganismes = filteredOrganismes?.filter((item) => {
      if (item.ferme !== undefined) return organismesFilters.ferme?.includes(item.ferme);
    });

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

  if (organismesFilters.transmission?.length && organismesFilters.transmission?.length > 0)
    filteredOrganismes = filteredOrganismes?.filter(
      (item) =>
        organismesFilters.transmission?.some(
          (filter) => (!!filter && !!item.last_transmission_date) || (!filter && !item.last_transmission_date)
        )
    );

  if (organismesFilters.etatUAI?.length && organismesFilters.etatUAI?.length > 0)
    filteredOrganismes = filteredOrganismes?.filter(
      (item) => organismesFilters.etatUAI?.some((filter) => (!!filter && !!item.uai) || (!filter && !item.uai))
    );

  return filteredOrganismes;
}
