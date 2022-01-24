const cliProgress = require("cli-progress");
const omit = require("lodash.omit");

const { runScript } = require("../scriptWrapper");
const { collectionNames } = require("../constants");
const logger = require("../../common/logger");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const { jobNames } = require("../../common/model/constants");

const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

runScript(async ({ effectifs, db }) => {
  await identifyHistoryWithBadDates({ effectifs, db });
}, jobNames.statutsCandidatsBadHistoryIdentifyBadDates);

const identifyHistoryWithBadDates = async ({ effectifs, db }) => {
  logger.info("Run identification statuts-candidats with historique_statut_apprenant with non-chronological order...");

  const resultsCollection = db.collection(collectionNames.statutsAvecDatesInvalidesDansHistorique);
  await resultsCollection.deleteMany({});

  // Identify all statuts with bad dates in history
  const statutsWithBadDatesInHistory = await effectifs.getStatutsWithBadDate();

  loadingBar.start(statutsWithBadDatesInHistory.length, 0);

  // Update flag to true
  await asyncForEach(statutsWithBadDatesInHistory, async (statutWithBadeDates) => {
    loadingBar.increment();
    await resultsCollection.insertOne({
      ...omit(statutWithBadeDates, "_id"),
      original_id: statutWithBadeDates._id,
    });
  });

  loadingBar.stop();
  logger.info("End");
};
