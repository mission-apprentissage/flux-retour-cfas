const { runScript } = require("../scriptWrapper");
const logger = require("../../common/logger");
const importData = require("./import/importData");
const buildStats = require("./import/buildStats");
const { DsDossier } = require("../../common/model");

runScript(async () => {
  logger.info("Import des données DS");

  // Nettoyage si besoin
  const nbDossiersInDb = await DsDossier.countDocuments({});
  if (nbDossiersInDb !== 0) {
    logger.info(`-> ${nbDossiersInDb} dossiers déja en base - clean de la bdd ...`);
    await DsDossier.deleteMany({});
  }
  await importData();

  logger.info("Calcul des stats ...");
  await buildStats();

  logger.info("Fin de l'import des données DS");
});
