/**
 * Noms des actions des UserEvents
 */
const USER_EVENTS_ACTIONS = {
  DOSSIER_APPRENANT: "dossier-apprenants",
  EXPORT: {
    ANONYMIZED_EFFECTIFS_LISTS: {
      TERRITOIRE_NATIONAL: "export-anonymized-effectifs-lists-territoire-national",
      TERRITOIRE_REGION: "export-anonymized-effectifs-lists-territoire-region",
      TERRITOIRE_DEPARTEMENT: "export-anonymized-effectifs-lists-territoire-departement",
      RESEAU: "export-anonymized-effectifs-lists-reseau",
      FORMATION: "export-anonymized-effectifs-lists-formation",
      CFA: "export-anonymized-effectifs-lists-cfa",
    },
    XLSX_EFFECTIFS_LISTS: "export-xlsx-effectifs-lists",
    CSV_REPARTITION_ORGANISME: "export-csv-repartition-effectifs-par-organisme",
    CSV_REPARTITION_FORMATION: "export-csv-repartition-effectifs-par-formation",
  },
  LOGIN: "login",
  LOGIN_CFA: "login-cfa",
  UPDATE_PASSWORD: "update-password",
};

const getExportAnonymizedEventNameFromFilters = (filters) => {
  if ("etablissement_num_region" in filters) {
    return USER_EVENTS_ACTIONS.EXPORT.ANONYMIZED_EFFECTIFS_LISTS.TERRITOIRE_REGION;
  }
  if ("etablissement_num_departement" in filters) {
    return USER_EVENTS_ACTIONS.EXPORT.ANONYMIZED_EFFECTIFS_LISTS.TERRITOIRE_DEPARTEMENT;
  }
  if ("etablissement_reseaux" in filters) {
    return USER_EVENTS_ACTIONS.EXPORT.ANONYMIZED_EFFECTIFS_LISTS.RESEAU;
  }
  if ("formation_cfd" in filters) {
    return USER_EVENTS_ACTIONS.EXPORT.ANONYMIZED_EFFECTIFS_LISTS.FORMATION;
  }
  if ("uai_etablissement" in filters) {
    return USER_EVENTS_ACTIONS.EXPORT.ANONYMIZED_EFFECTIFS_LISTS.CFA;
  }
  return USER_EVENTS_ACTIONS.EXPORT.ANONYMIZED_EFFECTIFS_LISTS.TERRITOIRE_NATIONAL;
};

module.exports = { USER_EVENTS_ACTIONS, getExportAnonymizedEventNameFromFilters };
