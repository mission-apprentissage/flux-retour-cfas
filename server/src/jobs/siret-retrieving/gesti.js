const logger = require("../../common/logger");
const path = require("path");
const { runScript } = require("../scriptWrapper");
const { readJsonFromCsvFile } = require("../../common/utils/fileUtils");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const { StatutCandidat } = require("../../common/model");
const { downloadIfNeeded } = require("./utils/");

const siretGestiReferenceFilePath = path.join(__dirname, `./assets/sirets-gesti.csv`);

/* Ce script permet de récupérer les SIRET pour les données n'ayant aucun siret présent */
runScript(async () => {
  logger.info("Run Siret Retrieving Job for Gesti");
  await retrieveSiret();
  logger.info("End Siret Retrieving Job");
});

const retrieveSiret = async () => {
  logger.info("Retrieving sirets for Gesti");

  // Gets the referentiel file
  await downloadIfNeeded(`siret-erps/sirets-gesti.csv`, siretGestiReferenceFilePath);

  // Parse all data for gesti with siret_etablissement null & uai not null
  const statutsWithoutSiretsWithUais = await StatutCandidat.find({
    source: "gesti",
    $and: [{ siret_etablissement: null }, { uai_etablissement: { $ne: null } }],
  });

  await asyncForEach(statutsWithoutSiretsWithUais, async (currentStatutWithoutSiret) => {
    const siretFound = findSiretForUai(currentStatutWithoutSiret.uai_etablissement);
    logger.info(siretFound);
  });
};

const findSiretForUai = (uai, filepath) => {
  const jsonData = readJsonFromCsvFile(__dirname + filepath);
  logger.info(jsonData);
  return "123";
};
