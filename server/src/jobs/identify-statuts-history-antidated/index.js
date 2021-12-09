const { runScript } = require("../scriptWrapper");
const logger = require("../../common/logger");
const { StatutCandidat } = require("../../common/model");
const cliProgress = require("cli-progress");
const { asyncForEach } = require("../../common/utils/asyncUtils");

const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

runScript(async ({ dashboard }) => {
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
}, "Identify-Statuts-Antidated");
