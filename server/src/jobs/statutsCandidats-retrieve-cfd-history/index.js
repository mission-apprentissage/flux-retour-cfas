const { runScript } = require("../scriptWrapper");
const { getCfdInfo } = require("../../common/apis/apiTablesCorrespondances");
const cliProgress = require("cli-progress");
const logger = require("../../common/logger");
const { StatutCandidatModel } = require("../../common/model");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const { jobNames } = require("../../common/model/constants");

const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

/**
 * Ce script permet d'identifier les CFD outdated, de récupérer les nouveaux CFD ainsi que les dates de début/fin
 * pour chaque statutCandidat en utilisant la librairie TCO
 */
runScript(async ({ db }) => {
  logger.info("Run CFD History Retrieving Job");

  // Retrieve CFD
  await retrieveCfdHistory(db);
  logger.info("End CFD History Retrieving Job");
}, jobNames.statutsCandidatsRetrieveCfdHistory);

/**
 * Parse tous les CFD dans les statuts Candidats et update les champs nécessaires depuis l'API TCO
 */
const retrieveCfdHistory = async (db) => {
  const collection = db.collection("statutsCandidats");

  // get all valid CFDs
  const allCfds = await collection.distinct("formation_cfd");

  logger.info(`Searching in TCO Api for ${allCfds.length} CFD in statutsCandidats`);
  loadingBar.start(allCfds.length, 0);

  await asyncForEach(allCfds, async (currentCfd) => {
    // Check cfd info from TCO lib
    const cfdInfo = await getCfdInfo(currentCfd);

    if (cfdInfo !== null) {
      // Update in statuts
      await StatutCandidatModel.updateMany(
        { formation_cfd: currentCfd },
        {
          formation_cfd_is_outdated: cfdInfo.cfd_outdated ?? false,
          formation_cfd_new: cfdInfo.cfd !== currentCfd ? cfdInfo.cfd : null, // if cfd returned different from param this is the new cfd
          formation_cfd_end_date: cfdInfo.date_fermeture ? new Date(cfdInfo.date_fermeture) : null, // timestamp format is returned by TCO
          formation_cfd_start_date: cfdInfo.date_ouverture ? new Date(cfdInfo.date_ouverture) : null, // timestamp format is returned by TCO
        }
      );
    }
    loadingBar.increment();
  });

  loadingBar.stop();
};
