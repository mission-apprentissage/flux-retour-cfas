const cliProgress = require("cli-progress");

const { runScript } = require("../../scriptWrapper");
const logger = require("../../../common/logger");
const { asyncForEach } = require("../../../common/utils/asyncUtils");
const { jobNames } = require("../../../common/constants/jobsConstants");
const { duplicatesTypesCodes } = require("../../../common/constants/dossierApprenantConstants");

const { collectionNames } = require("../../constants");

const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

/**
 * Job de suppression des doublons d'UAIs
 * Récupère les doublons et ne conserve que le plus récent
 */
runScript(async ({ dossiersApprenants, db }) => {
  await cleanUaisDuplicates({ dossiersApprenants, db });
}, jobNames.dossiersApprenantsBadHistoryIdentifyAntidated);

const cleanUaisDuplicates = async ({ dossiersApprenants, db }) => {
  logger.info("Run clean statuts-candidats with duplicates uais...");

  const resultsCollection = db.collection(collectionNames.statutsCandidatsDoublonsUais);
  await resultsCollection.deleteMany({});

  // Identify all uais duplicates
  const uaisDuplicates = await dossiersApprenants.getDuplicatesList(
    duplicatesTypesCodes.uai_etablissement.code,
    {},
    { allowDiskUse: true }
  );
  loadingBar.start(uaisDuplicates.length, 0);

  // Find most ancients entry for each duplicate
  await asyncForEach(uaisDuplicates, async (currentDuplicate) => {
    loadingBar.increment();

    // Identify duplicates to remove by slicing the discriminants sorted list
    const duplicatesIdToRemove = currentDuplicate.discriminants.duplicatesCreatedDatesAndIds
      .sort((a, b) => b.created_at - a.created_at)
      .slice(1, currentDuplicate.discriminants.duplicatesCreatedDatesAndIds.length)
      .map((item) => item.id);

    // Delete each ancient duplicates
    await asyncForEach(duplicatesIdToRemove, async (currentIdToRemove) => {
      await db.collection("dossiersApprenants").deleteOne({ _id: currentIdToRemove });
    });
  });

  loadingBar.stop();
  logger.info("End cleaning DossierApprenant with duplicates uais !");
};
