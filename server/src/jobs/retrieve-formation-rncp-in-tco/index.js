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

  let matchedCount = 0;

  await asyncForEach(allValidCfds.slice(0, 50), async (cfd) => {
    const cfdInfo = await getCfdInfo(cfd);

    if (cfdInfo?.rncp?.code_rncp) {
      matchedCount++;
    }
    loadingBar.increment();
  });
  loadingBar.stop();
  logger.info(`${matchedCount} RNCP found`);
}, "retrieve-rncp-in-tco-for-cfds");
