const { runScript } = require("../../scriptWrapper");
const cliProgress = require("cli-progress");
const path = require("path");
const logger = require("../../../common/logger");
const { CfaDataFeedbackModel } = require("../../../common/model");
const { asyncForEach } = require("../../../common/utils/asyncUtils");
const { JOB_NAMES } = require("../../../common/constants/jobsConstants");

const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
const feedbacksToRemoveFilePath = path.join(__dirname, `./assets/feedbacksToRemove.json`);

/**
 * Ce script permet nettoyer les Feedbacks en utilisant un fichier JSON de feedbacks à supprimer
 */
runScript(async ({ ovhStorage }) => {
  logger.info("Run Clean CFA Data Feedback Job");
  await removeFeedbacksFromJson(ovhStorage);
  logger.info("End Clean CFA Data Feedback Job");
}, JOB_NAMES.cleanCfaDataFeedback);

/**
 * Parse tous les Feedback depuis un fichier JSON
 * Si feedback présent en base, suppression
 */
const removeFeedbacksFromJson = async (ovhStorage) => {
  // Gets the referentiel file
  await ovhStorage.downloadIfNeededFileTo(`feedback/feedbacksToRemove.json`, feedbacksToRemoveFilePath);

  const allFeedbacksToRemove = require(feedbacksToRemoveFilePath);

  logger.info(`Searching for ${allFeedbacksToRemove.length} feedbacks in reference file`);
  loadingBar.start(allFeedbacksToRemove.length, 0);

  await asyncForEach(allFeedbacksToRemove, async (feedbackToRemove) => {
    await CfaDataFeedbackModel.findOneAndDelete({
      siret: feedbackToRemove.siret,
      email: feedbackToRemove.email,
      details: feedbackToRemove.details,
      created_at: feedbackToRemove.created_at,
    });

    loadingBar.increment();
  });

  loadingBar.stop();
};
