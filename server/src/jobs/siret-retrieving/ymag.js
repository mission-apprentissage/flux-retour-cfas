const logger = require("../../common/logger");
const { runScript } = require("../scriptWrapper");
const { StatutCandidat } = require("../../common/model");
const { asyncForEach } = require("../../common/utils/asyncUtils");

/**
 * Ce script permet de récupérer les SIRETs Ymag pour les statuts n'ayant aucun siret présent
 * Utilise les données de la collection StatutCandidats existantes
 */
runScript(async () => {
  logger.info("Run Siret Retrieving Job for Ymag");
  await retrieveSiret();
  logger.info("End Siret Retrieving Job");
});

const retrieveSiret = async () => {
  logger.info("Retrieving sirets for YMag");

  // Parse all data for ymag with siret_etablissement null & uai not null
  const statutsWithoutSiretsWithUais = await StatutCandidat.find({
    source: "ymag",
    $and: [{ siret_etablissement: null }, { uai_etablissement: { $ne: null } }],
  });

  await asyncForEach(statutsWithoutSiretsWithUais, async (currentStatutWithoutSiret) => {
    // Search a matching siret for uai
    const siretFound = await findSiretForUai(currentStatutWithoutSiret.uai_etablissement);

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

const findSiretForUai = async (uai) => {
  logger.info(`-- Searching Siret for uai ${uai}`);

  // Search siret in existing StatutCandidats
  const referenceDataForUai = await StatutCandidat.findOne({
    source: "ymag",
    $and: [{ siret_etablissement: { $ne: null } }, { uai_etablissement: { $ne: null } }],
  });

  if (referenceDataForUai) {
    logger.info(`Siret for uai ${uai} found : ${referenceDataForUai.siret_etablissement}`);
    return referenceDataForUai.siret_etablissement;
  } else {
    logger.info(`Siret not found for uai ${uai}`);
    return null;
  }
};
