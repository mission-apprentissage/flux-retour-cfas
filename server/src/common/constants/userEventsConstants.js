/**
 * Nom des types des UserEvents
 */
export const USER_EVENTS_TYPES = {
  POST: "POST",
  GET: "GET",
  EXPORT_CSV: "EXPORT-CSV",
};
/**
 * Noms des actions des UserEvents
 */
export const USER_EVENTS_ACTIONS = {
  DOSSIER_APPRENANT: "dossier-apprenants",
  EXPORT_CSV_EFFECTIFS_LISTS: {
    TERRITOIRE_NATIONAL: "export-csv-effectifs-territoire-national",
    TERRITOIRE_REGION: "export-csv-effectifs-territoire-region",
    TERRITOIRE_DEPARTEMENT: "export-csv-effectifs-territoire-departement",
    RESEAU: "export-csv-effectifs-reseau",
    FORMATION: "export-csv-effectifs-formation",
    CFA_ANONYMOUS: "export-csv-effectifs-anonymes-cfa",
    CFA_NAMED_DATA: "export-csv-effectifs-nominatifs-cfa",
  },
  LOGIN: "login",
  UPDATE_PASSWORD: "update-password",
};

export const getExportAnonymizedEventNameFromFilters = (filters) => {
  if ("etablissement_num_region" in filters) {
    return USER_EVENTS_ACTIONS.EXPORT_CSV_EFFECTIFS_LISTS.TERRITOIRE_REGION;
  }
  if ("etablissement_num_departement" in filters) {
    return USER_EVENTS_ACTIONS.EXPORT_CSV_EFFECTIFS_LISTS.TERRITOIRE_DEPARTEMENT;
  }
  if ("etablissement_reseaux" in filters) {
    return USER_EVENTS_ACTIONS.EXPORT_CSV_EFFECTIFS_LISTS.RESEAU;
  }
  if ("formation_cfd" in filters) {
    return USER_EVENTS_ACTIONS.EXPORT_CSV_EFFECTIFS_LISTS.FORMATION;
  }
  if ("uai_etablissement" in filters) {
    return USER_EVENTS_ACTIONS.EXPORT_CSV_EFFECTIFS_LISTS.CFA_ANONYMOUS;
  }
  return USER_EVENTS_ACTIONS.EXPORT_CSV_EFFECTIFS_LISTS.TERRITOIRE_NATIONAL;
};
