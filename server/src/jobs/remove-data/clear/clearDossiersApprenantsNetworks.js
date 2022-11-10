const { runScript } = require("../../scriptWrapper");
const logger = require("../../../common/logger");
const { JOB_NAMES } = require("../../../common/constants/jobsConstants");
const { dossiersApprenantsDb } = require("../../../common/model/collections");

runScript(async () => {
  logger.info("Suppression du champ etablissement_reseaux de tous les documents dossiersApprenants ....");
  await dossiersApprenantsDb().updateMany({}, { $unset: { etablissement_reseaux: 1 } });
  logger.info(
    "Suppression du champ etablissement_reseaux de tous les documents dossiersApprenants terminée avec succès !"
  );
}, JOB_NAMES.clearDossiersApprenantsNetworks);
