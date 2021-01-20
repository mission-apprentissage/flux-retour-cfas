const logger = require("../../common/logger");
const path = require("path");
const { runScript } = require("../scriptWrapper");
const { downloadIfNeeded } = require("./utils");

const siretYmagReferenceFilePath = path.join(__dirname, `./assets/sirets-ymag.csv`);

/* Ce script permet de récupérer les SIRET pour les données n'ayant aucun siret présent */
runScript(async () => {
  logger.info("Run Siret Retrieving Job for Ymag");
  await retrieveSiret();
  logger.info("End Siret Retrieving Job");
});

const retrieveSiret = async () => {
  logger.info("Retrieving sirets for YMag");
  await downloadIfNeeded(`siret-erps/sirets-ymag.csv`, siretYmagReferenceFilePath);
};
