const cliProgress = require("cli-progress");

const { runScript } = require("../../scriptWrapper");
const logger = require("../../../common/logger");
const { asyncForEach } = require("../../../common/utils/asyncUtils");
const { jobNames, duplicatesTypesCodes } = require("../../../common/model/constants");
const { collectionNames } = require("../../constants");

const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

/**
 * Job de suppression des doublons d'UAIs
 * Récupère les doublons et ne conserve que le plus récent
 */
runScript(async ({ statutsCandidats, db }) => {
  await cleanUaisDuplicates({ statutsCandidats, db });
}, jobNames.statutsCandidatsBadHistoryIdentifyAntidated);

const cleanUaisDuplicates = async ({ statutsCandidats, db }) => {
  logger.info("Run clean statuts-candidats with duplicates uais...");

  const resultsCollection = db.collection(collectionNames.statutsCandidatsDoublonsUais);
  await resultsCollection.deleteMany({});

  // Identify all uais duplicates
  const uaisDuplicates = await statutsCandidats.getDuplicatesList(
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
      await db.collection("statutsCandidats").deleteOne({ _id: currentIdToRemove });
    });
  });

  loadingBar.stop();
  logger.info("End cleaning statuts-candidats with duplicates uais !");
};
