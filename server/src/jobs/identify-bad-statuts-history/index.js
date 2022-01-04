const cliProgress = require("cli-progress");
const omit = require("lodash.omit");

const { runScript } = require("../scriptWrapper");
const { collectionNames } = require("../constants");
const logger = require("../../common/logger");
const { asyncForEach } = require("../../common/utils/asyncUtils");

const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

runScript(async ({ dashboard, db }) => {
  await identifyHistoryDateUnordered({ dashboard, db });
  await identifyHistoryWithBadDates({ dashboard, db });
}, "Identify-Statuts-Antidated");

const identifyHistoryDateUnordered = async ({ dashboard, db }) => {
  const resultsCollection = db.collection(collectionNames.statutsAvecHistoriqueSansOrdreChronologique);
  await resultsCollection.deleteMany({});

  // Identify all statuts with historique_statut_apprenant unordered
  const statutsWithUnorderedHistory = await dashboard.getStatutsWithHistoryDateUnordered();

  loadingBar.start(statutsWithUnorderedHistory.length, 0);

  // Update flag to true
  await asyncForEach(statutsWithUnorderedHistory, async (statutWithUnorderedHistory) => {
    loadingBar.increment();
    await resultsCollection.insertOne({
      ...omit(statutWithUnorderedHistory, "_id"),
      original_id: statutWithUnorderedHistory._id,
    });
  });

  loadingBar.stop();
  logger.info("End Identifying unordered history Statuts....");
};

const identifyHistoryWithBadDates = async ({ db, dashboard }) => {
  logger.info("Run Identifying History Statuts with bad dates....");

  const resultsCollection = db.collection(collectionNames.statutsAvecDatesInvalidesDansHistoriqu);
  await resultsCollection.deleteMany({});

  // Identify all statuts with bad dates in history
  const statutsWithBadDatesInHistory = await dashboard.getStatutsWithBadDate();

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
  logger.info("End Identifying History Statuts with bad dates....");
};
