/**
 * Noms des actions des UserEvents
 */
const USER_EVENTS_ACTIONS = {
  DOSSIER_APPRENANT: "dossier-apprenants",
  EXPORT: {
    ANONYMIZED_DATA_LISTS: "export-anonymized-data-lists",
    XLSX_DATA_LISTS: "export-xlsx-data-lists",
    CSV_REPARTITION_ORGANISME: "export-csv-repartition-effectifs-par-organisme",
    CSV_REPARTITION_FORMATION: "export-csv-repartition-effectifs-par-formation",
  },
  LOGIN: "login",
  LOGIN_CFA: "login-cfa",
  UPDATE_PASSWORD: "update-password",
};

module.exports = { USER_EVENTS_ACTIONS };
