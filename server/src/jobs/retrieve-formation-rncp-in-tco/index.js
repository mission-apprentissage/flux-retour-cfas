import cliProgress from "cli-progress";
import { runScript } from "../scriptWrapper.js";
import { asyncForEach } from "../../common/utils/asyncUtils.js";
import { getCfdInfo } from "../../common/apis/apiTablesCorrespondances.js";
import logger from "../../common/logger.js";

const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

/**
 * Ce script permet de récupérer les RNCP pour les dossiersApprenants n'en ayant pas ; le code RNCP est retrouvé via le CFD dans les TCO
 */
runScript(async ({ db }) => {
  const allValidCfds = await db.collection("dossiersApprenants").distinct("formation_cfd", {
    formation_rncp: null,
  });

  logger.info(
    `${allValidCfds.length} valid CFD found for dossiersApprenants without RNCP. Will search for RNCP in TCO...`
  );
  loadingBar.start(allValidCfds.length, 0);

  let matchedCfdCount = 0;
  let updatedDossiersApprenantsCount = 0;

  await asyncForEach(allValidCfds, async (cfd) => {
    const cfdInfo = await getCfdInfo(cfd);

    if (cfdInfo?.rncp?.code_rncp) {
      matchedCfdCount++;

      const { modifiedCount } = await db.collection("dossiersApprenants").updateMany(
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
      updatedDossiersApprenantsCount += modifiedCount;
    }
    loadingBar.increment();
  });
  loadingBar.stop();
  logger.info(`${matchedCfdCount} RNCP found for ${allValidCfds.length} valid CFDs`);
  logger.info(`${updatedDossiersApprenantsCount} dossiersApprenants updated with RNCP found in TCO`);
}, "retrieve-formation-rncp-in-tco");
