/**
 * Nom des types des UserEvents
 */
const USER_EVENTS_TYPES = {
  POST: "POST",
  GET: "GET",
  EXPORT_CSV: "EXPORT-CSV",
};
/**
 * Noms des actions des UserEvents
 */
const USER_EVENTS_ACTIONS = {
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
  LOGIN_EVENT: {
    SUCCESS: "login-success",
    FAIL: "login-failed",
  }, // TODO Merge Login & LoginEvent
  LOGIN_CFA: "login-cfa",
  UPDATE_PASSWORD: "update-password",
  REGISTER: "register",
  USERS: {
    GET_ALL: "get-all",
  },
  UPLOAD: {
    INIT: "upload-init",
    SUCCESS: "upload-success",
    ERROR: "upload-error",
    IMPORT: "upload-import-data",
  },
};

const getExportAnonymizedEventNameFromFilters = (filters, namedMode = false) => {
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
    return namedMode === true
      ? USER_EVENTS_ACTIONS.EXPORT_CSV_EFFECTIFS_LISTS.CFA_NAMED_DATA
      : USER_EVENTS_ACTIONS.EXPORT_CSV_EFFECTIFS_LISTS.CFA_ANONYMOUS;
  }
  return USER_EVENTS_ACTIONS.EXPORT_CSV_EFFECTIFS_LISTS.TERRITOIRE_NATIONAL;
};

module.exports = { USER_EVENTS_TYPES, USER_EVENTS_ACTIONS, getExportAnonymizedEventNameFromFilters };
