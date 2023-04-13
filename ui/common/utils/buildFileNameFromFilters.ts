export const buildFileName = (base, filters) => {
  let fileName = base;

  if (filters.departement && !filters.cfa) {
    fileName = fileName.concat("_departement_", filters.departement.nom);
  }
  if (filters.region && !filters.cfa) {
    fileName = fileName.concat("_region_", filters.region.nom);
  }
  if (filters.cfa) {
    fileName = fileName.concat("_uai_", filters.cfa.uai_etablissement);
  }
  if (filters.formation) {
    fileName = fileName.concat("_cfd_", filters.formation.cfd);
  }
  if (filters.reseau) {
    fileName = fileName.concat("_reseau_", filters.reseau.nom);
  }
  if (filters.date) {
    fileName = fileName.concat("_", filters.date.toISOString());
  }

  return fileName.concat(".csv");
};
