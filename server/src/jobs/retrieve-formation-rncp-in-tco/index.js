const cliProgress = require("cli-progress");

const { runScript } = require("../scriptWrapper");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const { getCfdInfo } = require("../../common/apis/apiTablesCorrespondances");
const logger = require("../../common/logger");

const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

/**
 * Ce script permet d'analyser le nombre de CFD en base pour lesquels on trouve un RNCP dans les TCO
 */
runScript(async ({ db }) => {
  const allValidCfds = await db.collection("statutsCandidats").distinct("formation_cfd", {
    formation_cfd_valid: true,
  });

  logger.info(`${allValidCfds.length} valid CFD found. Will search for RNCP in TCO...`);
  loadingBar.start(allValidCfds.length, 0);

  let matchedCfdCount = 0;
  let matchedStatutCandidatsCount = 0;

  await asyncForEach(allValidCfds, async (cfd) => {
    const cfdInfo = await getCfdInfo(cfd);

    if (cfdInfo?.rncp?.code_rncp) {
      matchedCfdCount++;

      const nbStatutsMatched = await db.collection("statutsCandidats").countDocuments({
        formation_cfd: cfd,
      });
      matchedStatutCandidatsCount += nbStatutsMatched;
    }
    loadingBar.increment();
  });
  loadingBar.stop();
  logger.info(`${matchedCfdCount} RNCP found for ${allValidCfds.length} valid CFDs`);
  logger.info(`${matchedStatutCandidatsCount} statuts candidats with RNCP found in TCO`);
}, "retrieve-rncp-in-tco-for-cfds");
