const logger = require("../../common/logger");
const { runScript } = require("../scriptWrapper");
const { StatutCandidat } = require("../../common/model");
const { asyncForEach } = require("../../common/utils/asyncUtils");

/**
 * Ce script permet de récupérer les SIRETs Ymag pour les statuts n'ayant aucun siret présent
 * Utilise les données de la collection StatutCandidats existantes
 */
runScript(async ({ statutsCandidats }) => {
  logger.info("Run Siret Retrieving Job for Ymag");
  await retrieveSiret(statutsCandidats);
  logger.info("End Siret Retrieving Job");
});

const retrieveSiret = async (statutsCandidats) => {
  logger.info("Retrieving sirets for YMag");

  // Parse all data for ymag with siret_etablissement invalid & uai valid
  const statutsWithoutSiretsWithUais = await StatutCandidat.find({
    source: "ymag",
    $and: [{ siret_etablissement_valid: false }, { uai_etablissement_valid: true }],
  });

  await asyncForEach(statutsWithoutSiretsWithUais, async (currentStatutWithoutSiret) => {
    // Search a matching siret for uai
    const siretFound = await findSiretForUai(currentStatutWithoutSiret.uai_etablissement);

    // Update siret in db
    if (siretFound) {
      const toUpdate = { ...currentStatutWithoutSiret, siret_etablissement: siretFound };
      await statutsCandidats.updateStatut(currentStatutWithoutSiret._id, toUpdate);
      logger.info(`StatutCandidat updated with siret : ${siretFound}`);
    }
  });
};

const findSiretForUai = async (uai) => {
  logger.info(`-- Searching Siret for uai ${uai}`);

  // Search siret in existing StatutCandidats with siret valid & uai valid
  const referenceDataForUai = await StatutCandidat.findOne({
    source: "ymag",
    $and: [{ siret_etablissement_valid: true }, { uai_etablissement_valid: true }],
  });

  if (referenceDataForUai) {
    logger.info(`Siret for uai ${uai} found : ${referenceDataForUai.siret_etablissement}`);
    return referenceDataForUai.siret_etablissement;
  } else {
    logger.info(`Siret not found for uai ${uai}`);
    return null;
  }
};
