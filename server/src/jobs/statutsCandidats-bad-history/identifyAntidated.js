const cliProgress = require("cli-progress");
const omit = require("lodash.omit");

const { runScript } = require("../scriptWrapper");
const logger = require("../../common/logger");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const { jobNames } = require("../../common/constants/jobsConstants");
const { collectionNames } = require("../constants");

const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

runScript(async ({ effectifs, db }) => {
  await identifyHistoryDateUnordered({ effectifs, db });
}, jobNames.statutsCandidatsBadHistoryIdentifyAntidated);

const identifyHistoryDateUnordered = async ({ effectifs, db }) => {
  logger.info("Run identification statuts-candidats with historique_statut_apprenant with invalid dates...");

  const resultsCollection = db.collection(collectionNames.statutsAvecHistoriqueSansOrdreChronologique);
  await resultsCollection.deleteMany({});

  // Identify all statuts with historique_statut_apprenant unordered
  const statutsWithUnorderedHistory = await effectifs.getStatutsWithHistoryDateUnordered();

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
  logger.info("End");
};
