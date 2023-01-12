import { omitNullishValues } from "./omitNullishValues";

export const mapFiltersToApiFormat = (filters) => {
  return omitNullishValues({
    date: filters.date.toISOString(),
    etablissement_num_region: filters.region?.code ?? null,
    etablissement_num_departement: filters.departement?.code ?? null,
    formation_cfd: filters.formation?.cfd ?? null,
    uai_etablissement: filters.cfa?.uai_etablissement ?? null,
    siret_etablissement: filters.sousEtablissement?.siret_etablissement ?? null,
    etablissement_reseaux: filters.reseau?.nom ?? null,
  });
};

/**
 * TODO Refacto ? Placer ailleurs ?
 * @param {*} filters
 * @returns
 */
export const mapSimpleFiltersToApiFormat = (filtersValues) => {
  return {
    date: filtersValues?.date.toISOString(),
    ...(filtersValues?.uai ? { uai_etablissement: filtersValues.uai } : {}),
    ...(filtersValues?.organismeId ? { organisme_id: filtersValues.organismeId } : {}),
  };
};
