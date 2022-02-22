const { runScript } = require("../scriptWrapper");
const logger = require("../../common/logger");
const { jobNames } = require("../../common/constants/jobsConstants");
const { collectionNames } = require("../constants");
const cliProgress = require("cli-progress");

const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

runScript(async ({ db }) => {
  await cleanRupturantsWithSameDateElements({ db });
}, jobNames.statutsCandidatsBadHistoryCleanAntidated);

const cleanRupturantsWithSameDateElements = async ({ db }) => {
  logger.info("Run Cleaning rupturants with same dates in historique_statut_apprenant....");

  const count = await db
    .collection(collectionNames.statutsAvecDerniersElementsHistoriqueDateIdentique)
    .countDocuments();
  logger.info(`Found ${count} statuts with same date in historique_statut_apprenant considered rupturants`);

  loadingBar.start(count, 0);
  let cleanedCount = 0;

  const cursor = db.collection(collectionNames.statutsAvecDerniersElementsHistoriqueDateIdentique).find();
  // Remove two last statuts
  while (await cursor.hasNext()) {
    const statutWithAntidatedHistory = await cursor.next();
    loadingBar.increment();
    const historique = statutWithAntidatedHistory.historique_statut_apprenant;

    const cleanedHistory = historique.slice(0, -2);
    await db
      .collection("statutsCandidats")
      .updateOne(
        { _id: statutWithAntidatedHistory.original_id },
        { $set: { historique_statut_apprenant: cleanedHistory, history_cleaned_date: new Date() } }
      );
    cleanedCount++;
  }

  loadingBar.stop();
  logger.info(`Cleaned historique_statut_apprenant for ${cleanedCount} statuts candidats`);
  logger.info("End");
};
