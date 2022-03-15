const { runScript } = require("../../scriptWrapper");
const logger = require("../../../common/logger");
const { jobNames } = require("../../../common/constants/jobsConstants");
const { DossierApprenantModel } = require("../../../common/model");

runScript(async () => {
  logger.info("Suppression de tous réseaux des statuts cfas ....");
  await DossierApprenantModel.updateMany({}, { $unset: { etablissement_reseaux: 1 } });
  logger.info("Tous les réseaux des statuts cfas ont été supprimés avec succès !");
}, jobNames.clearDossiersApprenantsNetworks);
