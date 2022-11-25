import { runScript } from "../scriptWrapper.js";
import logger from "../../common/logger.js";
import { dossiersApprenantsDb } from "../../common/model/collections.js";

runScript(async () => {
  const filters = {
    id_erp_apprenant: null,
    annee_scolaire: { $in: ["2022-2022", "2022-2023"] },
  };
  const count = await dossiersApprenantsDb().countDocuments(filters);
  logger.info(count, "dossiers apprenants sans id_erp_appernant sur l'année 2022-2023");
  const result = await dossiersApprenantsDb().deleteMany(filters);
  logger.info(result.deletedCount, "dossiers apprenants supprimés");
}, "suppression-dossiers-apprenants-sans-id-erp-apprenant");
