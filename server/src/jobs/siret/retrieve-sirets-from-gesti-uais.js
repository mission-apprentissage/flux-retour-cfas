const logger = require("../../common/logger");
const path = require("path");
const { runScript } = require("../scriptWrapper");
const { readJsonFromCsvFile } = require("../../common/utils/fileUtils");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const { StatutCandidat } = require("../../common/model");
const { downloadIfNeeded } = require("./utils");

const siretGestiReferenceFilePath = path.join(__dirname, `./assets/sirets-gesti.csv`);

/**
 * Ce script permet de récupérer les SIRETs Gesti pour les statuts n'ayant aucun siret présent
 * Utilise un fichier référentiel sirets-gesti contenant les couples SIRET-UAIs de Gesti
 */
runScript(async ({ statutsCandidats }) => {
  logger.info("Run Siret Retrieving Job for Gesti");
  await retrieveSiret(statutsCandidats);
  logger.info("End Siret Retrieving Job");
});

const retrieveSiret = async (statutsCandidats) => {
  logger.info("Retrieving sirets for Gesti");

  // Gets the reference file
  await downloadIfNeeded(`siret-erps/sirets-gesti.csv`, siretGestiReferenceFilePath);

  const uaiSiretGestiReference = readJsonFromCsvFile(siretGestiReferenceFilePath);
  if (!uaiSiretGestiReference) {
    logger.error("Error while reading Gesti reference file");
    return;
  }

  // retrieve statuts provided by gesti with a valid UAI but missing SIRET
  const statutsWithoutSiretsWithUais = await StatutCandidat.find({
    source: "gesti",
    siret_etablissement_valid: false,
    uai_etablissement_valid: true,
  });

  await asyncForEach(statutsWithoutSiretsWithUais, async (_statut) => {
    // Search a matching siret for uai
    const statutWithoutSiret = _statut.toJSON();
    const matchFoundInReference = uaiSiretGestiReference.find((x) => x.uai === statutWithoutSiret.uai_etablissement);

    // Update siret in db
    if (matchFoundInReference) {
      const toUpdate = {
        ...statutWithoutSiret,
        siret_etablissement: matchFoundInReference.siret,
        siret_etablissement_valid: true,
      };
      const updated = await statutsCandidats.updateStatut(statutWithoutSiret._id, toUpdate);
      logger.info(`StatutCandidat with _id ${updated._id} updated with siret : ${updated.siret_etablissement}`);
    } else {
      logger.info(`No SIRET found matching UAI ${statutWithoutSiret.uai_etablissement}`);
    }
  });
};
