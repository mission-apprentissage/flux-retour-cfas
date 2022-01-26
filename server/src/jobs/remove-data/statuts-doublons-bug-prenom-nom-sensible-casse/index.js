const { runScript } = require("../../scriptWrapper");
const logger = require("../../../common/logger");
const { StatutCandidatModel } = require("../../../common/model");

runScript(async () => {
  logger.info("Suppression des données issues du bug mis en production 24/01/2022...");
  const result = await StatutCandidatModel.deleteMany({ created_at: { $gte: new Date("2022-01-24T11:00:00.000Z") } });
  logger.info(result.deletedCount, "statuts candidats supprimés avec succès");
}, "suppression-données-doublon-bug-24-01-2022");
