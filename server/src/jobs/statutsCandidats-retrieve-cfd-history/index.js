const { runScript } = require("../scriptWrapper");
const { mongooseInstance } = require("../../common/mongodb");
const cliProgress = require("cli-progress");
const logger = require("../../common/logger");
const { StatutCandidat } = require("../../common/model");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const { jobNames } = require("../../common/model/constants");
const { initTcoModel, getCfdInfo, bcnImporter } = require("@mission-apprentissage/tco-service-node");

const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

/**
 * Ce script permet d'identifier les CFD outdated et récupérer les nouveaux CFD
 * pour chaque statutCandidat
 */
runScript(async ({ db }) => {
  logger.info("Run CFD History Retrieving Job");

  // Init Tco & BCN
  try {
    await initTcoModel(mongooseInstance, { noElastic: true });
    await bcnImporter();
  } catch (error) {
    logger.error(error);
  }

  // Retrieve CFD
  await retrieveCfdHistory(db);
  logger.info("End CFD History Retrieving Job");
}, jobNames.statutsCandidatsRetrieveCfdHistory);

/**
 * Parse tous les CFD dans les statuts Candidats
 * MAJ le champ formation_cfd_is_outdated & formation_cfd_new
 */
const retrieveCfdHistory = async (db) => {
  const collection = db.collection("statutsCandidats");

  // get all valid CFDs
  const allCfds = await collection.distinct("formation_cfd", { formation_cfd_valid: true });

  logger.info(`Searching for ${allCfds.length} CFD in statutsCandidats`);
  loadingBar.start(allCfds.length, 0);
  let nbHandled = 0;

  await asyncForEach(allCfds, async (currentCfd) => {
    nbHandled++;

    // Check cfd info from TCO lib
    const cfdInfo = await getCfdInfo(currentCfd);

    if (cfdInfo?.result) {
      // Update in statuts
      await StatutCandidat.updateMany(
        { formation_cfd: currentCfd },
        {
          formation_cfd_is_outdated: cfdInfo?.result?.cfd_outdated ?? false,
          formation_cfd_new: cfdInfo?.result?.cfd !== currentCfd ? cfdInfo?.result?.cfd : null, // if cfd returned different from param this is the new cfd
        }
      );
    }
    loadingBar.update(nbHandled);
  });

  loadingBar.stop();
};
