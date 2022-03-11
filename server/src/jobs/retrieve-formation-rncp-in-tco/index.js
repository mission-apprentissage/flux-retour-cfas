const cliProgress = require("cli-progress");

const { runScript } = require("../scriptWrapper");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const { getCfdInfo } = require("../../common/apis/apiTablesCorrespondances");
const logger = require("../../common/logger");
const { jobNames } = require("../../common/constants/jobsConstants");

const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

/**
 * Ce script permet de récupérer les RNCP pour les statuts n'en ayant pas ; le code RNCP est retrouvé via le CFD dans les TCO
 */
runScript(async ({ db }) => {
  const allValidCfds = await db.collection("statutsCandidats").distinct("formation_cfd", {
    formation_rncp: null,
  });

  logger.info(`${allValidCfds.length} valid CFD found for statuts without RNCP. Will search for RNCP in TCO...`);
  loadingBar.start(allValidCfds.length, 0);

  let matchedCfdCount = 0;
  let updatedStatutCandidatCount = 0;

  await asyncForEach(allValidCfds, async (cfd) => {
    const cfdInfo = await getCfdInfo(cfd);

    if (cfdInfo?.rncp?.code_rncp) {
      matchedCfdCount++;

      const { modifiedCount } = await db.collection("statutsCandidats").updateMany(
        {
          formation_cfd: cfd,
          formation_rncp: null,
        },
        {
          $set: {
            formation_rncp: cfdInfo.rncp.code_rncp,
          },
        }
      );
      updatedStatutCandidatCount += modifiedCount;
    }
    loadingBar.increment();
  });
  loadingBar.stop();
  logger.info(`${matchedCfdCount} RNCP found for ${allValidCfds.length} valid CFDs`);
  logger.info(`${updatedStatutCandidatCount} statuts candidats updated with RNCP found in TCO`);
}, jobNames.retrieveRncp);
