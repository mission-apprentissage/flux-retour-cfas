const { isEqual } = require("date-fns");

const { runScript } = require("../scriptWrapper");
const logger = require("../../common/logger");
const { jobNames } = require("../../common/constants/jobsConstants");
const { collectionNames } = require("../constants");
const cliProgress = require("cli-progress");
const { identifyElementCausingWrongRupturantSequence } = require("./utils");

const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

runScript(async ({ db }) => {
  await cleanBadHistoryInscritsElements({ db });
}, jobNames.statutsCandidatsBadHistoryCleanAntidated);

const cleanBadHistoryInscritsElements = async ({ db }) => {
  logger.info("Run Cleaning Antidated History Statuts inscrits elements....");

  const count = await db.collection(collectionNames.statutsAvecHistoriqueSansOrdreChronologique).countDocuments();
  logger.info(`Found ${count} statuts with antidated historique_statut_apprenant`);

  loadingBar.start(count, 0);
  let cleanedCount = 0;

  const cursor = db.collection(collectionNames.statutsAvecHistoriqueSansOrdreChronologique).find();
  // Remove inscrit statut from history
  while (await cursor.hasNext()) {
    const statutWithAntidatedHistory = await cursor.next();
    loadingBar.increment();
    const historique = statutWithAntidatedHistory.historique_statut_apprenant;

    const statutInscritToRemove = identifyElementCausingWrongRupturantSequence(historique);

    // If statut to remove found, update history without it
    if (statutInscritToRemove) {
      // Remove item matching on date_statut
      const cleanedHistory = historique.filter((item) => !isEqual(item.date_statut, statutInscritToRemove.date_statut));
      await db
        .collection("statutsCandidats")
        .updateOne(
          { _id: statutWithAntidatedHistory.original_id },
          { $set: { historique_statut_apprenant: cleanedHistory, history_cleaned_date: new Date() } }
        );
      cleanedCount++;
    }
  }

  loadingBar.stop();
  logger.info(`Cleaned historique_statut_apprenant for ${cleanedCount} statuts candidats`);
  logger.info("End Cleaning Antidated History Statuts inscrits elements !");
};
