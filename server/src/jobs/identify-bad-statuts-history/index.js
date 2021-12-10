const { runScript } = require("../scriptWrapper");
const logger = require("../../common/logger");
const { StatutCandidat } = require("../../common/model");
const cliProgress = require("cli-progress");
const { asyncForEach } = require("../../common/utils/asyncUtils");

const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

runScript(async ({ dashboard }) => {
  await identifyHistoryDateUnordered(dashboard);
  await identifyHistoryWithBadDates(dashboard);
}, "Identify-Statuts-Antidated");

const identifyHistoryDateUnordered = async (dashboard) => {
  logger.info("Run Identifying Antidated History Statuts....");

  // Clear flag (false)
  await StatutCandidat.updateMany({ history_antidated: false });

  // Identify all statuts with antidated history
  const statutsWithHistoryAntidated = await dashboard.getStatutsWithHistoryDateUnordered();

  loadingBar.start(statutsWithHistoryAntidated.length, 0);

  // Update flag to true
  await asyncForEach(statutsWithHistoryAntidated, async (currentStatutWithAntidatedHistory) => {
    loadingBar.increment();
    await StatutCandidat.findByIdAndUpdate(
      currentStatutWithAntidatedHistory._id,
      { $set: { history_antidated: true } },
      { new: true }
    );
  });

  loadingBar.stop();
  logger.info("End Identifying Antidated History Statuts....");
};

const identifyHistoryWithBadDates = async (dashboard) => {
  logger.info("Run Identifying History Statuts with bad dates....");

  // Clear flag (false)
  await StatutCandidat.updateMany({ history_with_bad_date: false });

  // Identify all statuts with bad dates in history
  const statutsWithBadDatesInHistory = await dashboard.getStatutsWithBadDate();

  loadingBar.start(statutsWithBadDatesInHistory.length, 0);

  // Update flag to true
  await asyncForEach(statutsWithBadDatesInHistory, async (currentStatutWithAntidatedHistory) => {
    loadingBar.increment();
    await StatutCandidat.findByIdAndUpdate(
      currentStatutWithAntidatedHistory._id,
      { $set: { history_with_bad_date: true } },
      { new: true }
    );
  });

  loadingBar.stop();
  logger.info("End Identifying History Statuts with bad dates....");
};
