import cliProgress from "cli-progress";
import { asyncForEach } from "../../../../common/utils/asyncUtils.js";
import logger from "../../../../common/logger.js";
import { createJobEvent } from "../../../../common/actions/jobEvents.actions.js";
import { effectifsDb } from "../../../../common/model/collections.js";
import { runEngine } from "../../../../common/actions/engine/engine.actions.js";

const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
const JOB_NAME = "refacto-migration-rerun-effectifs-engine";
/**
 * Ce script effectue la migration de la collection cfas vers la nouvelle collection organismes
 */
export const reRunEngineEffectifs = async () => {
  logger.info("Relancement de l'engine des effectifs...");

  let nbEffectifsUpdated = 0;
  const allEffectifs = await effectifsDb().find().toArray();

  loadingBar.start(allEffectifs.length, 0);

  await asyncForEach(allEffectifs, async (currentEffectif) => {
    try {
      const effectifData = { ...currentEffectif, organisme_id: currentEffectif.organisme_id.toString() };
      const { effectif } = await runEngine({ effectifData }, null);
      if (effectif.updated) nbEffectifsUpdated++;
    } catch (error) {
      // Si erreur on la stocke avec l'objet
      const { stack: errorStack, message: errorMessage } = error;
      await createJobEvent({
        jobname: JOB_NAME,
        date: new Date(),
        action: "error",
        data: {
          currentEffectif,
          error,
          errorStack,
          errorMessage,
        },
      });
    }

    loadingBar.increment();
  });

  loadingBar.stop();

  // Log & stats
  logger.info(`--> ${allEffectifs.length} effectifs initiaux`);
  logger.info(`--> ${nbEffectifsUpdated} effectifs maj`);

  await createJobEvent({
    jobname: JOB_NAME,
    date: new Date(),
    action: "finishing",
    data: {
      nbEffectifsInitiaux: allEffectifs.length,
    },
  });
};
