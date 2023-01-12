import { runScript } from "../../scriptWrapper.js";
import logger from "../../../common/logger.js";
import { JOB_NAMES } from "../../../common/constants/jobsConstants.js";
import { dossiersApprenantsDb } from "../../../common/model/collections.js";

runScript(async () => {
  logger.info("Suppression du champ etablissement_reseaux de tous les documents dossiersApprenants ....");
  await dossiersApprenantsDb().updateMany({}, { $unset: { etablissement_reseaux: 1 } });
  logger.info(
    "Suppression du champ etablissement_reseaux de tous les documents dossiersApprenants terminée avec succès !"
  );
}, JOB_NAMES.clearDossiersApprenantsNetworks);
