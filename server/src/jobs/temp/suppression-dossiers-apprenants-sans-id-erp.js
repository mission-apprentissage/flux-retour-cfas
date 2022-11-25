const { runScript } = require("../scriptWrapper.js");
const logger = require("../../common/logger.js");

runScript(async ({ db }) => {
  const filters = {
    id_erp_apprenant: null,
    annee_scolaire: { $in: ["2022-2022", "2022-2023"] },
  };
  const count = await db.collection("dossiersApprenants").countDocuments(filters);
  logger.info(count, "dossiers apprenants sans id_erp_appernant sur l'année 2022-2023");
  const result = await db.collection("dossiersApprenants").deleteMany(filters);
  logger.info(result.deletedCount, "dossiers apprenants supprimés");
}, "suppression-dossiers-apprenants-sans-id-erp-apprenant");
