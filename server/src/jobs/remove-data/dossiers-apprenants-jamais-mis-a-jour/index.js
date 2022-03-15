const { runScript } = require("../../scriptWrapper");
const logger = require("../../../common/logger");
const { DossierApprenantModel } = require("../../../common/model");
const { subDays } = require("date-fns");

runScript(async () => {
  logger.info("Suppression des dossiers apprenants créés il y a plus d'une semaine et jamais reçu à nouveau");

  const createdDateUpperLimit = subDays(new Date(), 8);

  const query = { created_at: { $lte: createdDateUpperLimit }, updated_at: null };
  const count = await DossierApprenantModel.countDocuments(query);

  logger.info(count, `dossiers apprenants créés avant le ${createdDateUpperLimit} et avec update_at = null trouvés`);
  const result = await DossierApprenantModel.deleteMany(query);

  logger.info(result.deletedCount, "dossiers apprenants supprimés avec succès");
}, "suppression-dossiers-apprenants-jamais-updated");
