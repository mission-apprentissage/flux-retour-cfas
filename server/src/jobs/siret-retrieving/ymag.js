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

  // retrieve statuts provided by ymag with a valid UAI but missing SIRET
  const statutsWithoutSiretsWithUais = await StatutCandidat.find({
    source: "ymag",
    siret_etablissement_valid: false,
    uai_etablissement_valid: true,
  });

  logger.info(`Found ${statutsWithoutSiretsWithUais?.length || 0} statuts with valid UAI but missing SIRET`);

  await asyncForEach(statutsWithoutSiretsWithUais, async (_statut) => {
    // Search a matching siret for uai
    const statutWithoutSiret = _statut.toJSON();
    const siretFound = await findSiretForUai(statutWithoutSiret.uai_etablissement);

    // Update siret in db
    if (siretFound) {
      const toUpdate = {
        ...statutWithoutSiret,
        siret_etablissement: siretFound,
        siret_etablissement_valid: true,
      };
      const updated = await statutsCandidats.updateStatut(statutWithoutSiret._id, toUpdate);
      logger.info(`StatutCandidat with _id ${updated._id} updated with siret : ${updated.siret_etablissement}`);
    } else {
      logger.info(`No SIRET found matching UAI ${statutWithoutSiret.uai_etablissement}`);
    }
  });
};
const findSiretForUai = async (uai) => {
  // Search siret in existing StatutCandidats with same uai but siret valid
  const referenceDataForUai = await StatutCandidat.findOne({
    source: "ymag",
    siret_etablissement_valid: true,
    uai_etablissement: uai,
  });

  if (referenceDataForUai) {
    logger.info(`Siret for uai ${uai} found : ${referenceDataForUai.siret_etablissement}`);
    return referenceDataForUai.siret_etablissement;
  }
  return null;
};
