const { runScript } = require("../../scriptWrapper");
const logger = require("../../../common/logger");
const { DossierApprenantModel } = require("../../../common/model");

runScript(async () => {
  logger.info("Suppression des statuts avec historique vide");

  const query = { historique_statut_apprenant: { $size: 0 } };
  const count = await DossierApprenantModel.countDocuments(query);
  logger.info(count, "statuts found");
  const result = await DossierApprenantModel.deleteMany(query);
  logger.info(result.deletedCount, "statuts candidats supprimés avec succès");
}, "suppression-statuts-candidats-historique-vide");
