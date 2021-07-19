const { runScript } = require("../scriptWrapper");
const logger = require("../../common/logger");
const cliProgress = require("cli-progress");
const { StatutCandidat } = require("../../common/model");
const { jobNames, statutsCandidatsStringFields } = require("../../common/model/constants");
const { asyncForEach } = require("../../common/utils/asyncUtils");

const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

/**
 * Ce script permet de modifier les champs strings chaine vide ("") à null
 */
runScript(async () => {
  logger.info("Run Sanitize Statut Candidat Empty Strings Job");

  await asyncForEach(statutsCandidatsStringFields, async (currentField) => {
    await sanitizeStatutCandidatField(currentField);
  });

  logger.info("End Sanitize Statut Candidat Empty Strings Job");
}, jobNames.statutsCandidatsSanitizeEmptyStrings);

/**
 * Méthode qui update tous les documents ayant le 'fieldName' = "" vers null
 * @param {*} fieldName
 */
const sanitizeStatutCandidatField = async (fieldName) => {
  logger.info(`Cleaning empty string for field ${fieldName}`);

  // Find documents to update
  const findQuery = {};
  findQuery[fieldName] = "";
  const toSanitize = await StatutCandidat.find(findQuery).lean();

  loadingBar.start(toSanitize.length, 0);

  // Update each document from "" to null
  await asyncForEach(toSanitize, async (currentStatutToClean) => {
    loadingBar.increment();

    // Update query
    const updateQuery = {};
    updateQuery[fieldName] = null;

    await StatutCandidat.findByIdAndUpdate(
      currentStatutToClean._id,
      {
        $set: updateQuery,
      },
      { new: true }
    );
  });

  loadingBar.stop();
};
