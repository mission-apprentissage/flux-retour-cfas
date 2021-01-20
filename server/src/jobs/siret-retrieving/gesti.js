const logger = require("../../common/logger");
const path = require("path");
const { runScript } = require("../scriptWrapper");
const { readJsonFromCsvFile } = require("../../common/utils/fileUtils");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const { StatutCandidat } = require("../../common/model");
const { downloadIfNeeded } = require("./utils/");

const siretGestiReferenceFilePath = path.join(__dirname, `./assets/sirets-gesti.csv`);

/**
 * Ce script permet de récupérer les SIRETs Gesti pour les statuts n'ayant aucun siret présent
 * Utilise un fichier référentiel sirets-gesti contenant les couples SIRET-UAIs de Gesti
 */
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
    // Search a matching siret for uai
    const siretFound = findSiretForUai(currentStatutWithoutSiret.uai_etablissement);

    // Update siret in db
    if (siretFound) {
      await StatutCandidat.findByIdAndUpdate(
        currentStatutWithoutSiret._id,
        { siret_etablissement: siretFound },
        { new: true }
      );
      logger.info(`StatutCandidat updated with siret : ${siretFound}`);
    }
  });
};

const findSiretForUai = (uai) => {
  logger.info(`-- Searching Siret for uai ${uai}`);
  const jsonData = readJsonFromCsvFile(siretGestiReferenceFilePath);
  if (!jsonData) return null;

  // Looking for uai in JSON Data from file
  const referenceDataForUai = jsonData.find((x) => x.uai === uai);
  if (referenceDataForUai) {
    logger.info(`Siret for uai ${uai} found : ${referenceDataForUai.siret}`);
    return referenceDataForUai.siret;
  } else {
    logger.info(`Siret not found for uai ${uai}`);
    return null;
  }
};
