import cliProgress from "cli-progress";
import { asyncForEach } from "../../../../common/utils/asyncUtils.js";
import logger from "../../../../common/logger.js";
import { createJobEvent } from "../../../../common/actions/jobEvents.actions.js";
import { dossiersApprenantsMigrationDb } from "../../../../common/model/collections.js";
import { runEngine } from "../../../../common/actions/engine/engine.actions.js";
import { structureEffectifFromDossierApprenant } from "../../../../common/actions/effectifs.actions.js";
import { findOrganismeByUai } from "../../../../common/actions/organismes/organismes.actions.js";

const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
const JOB_NAME = "refacto-migration-rerun-effectifs-engine";
/**
 * Ce script effectue la migration de la collection cfas vers la nouvelle collection organismes
 */
export const reRunEngineEffectifs = async () => {
  logger.info("Relancement de l'engine des effectifs...");

  let nbEffectifsUpdated = 0;
  const allDossiersApprenantsMigration = await dossiersApprenantsMigrationDb().find().toArray();

  loadingBar.start(allDossiersApprenantsMigration.length, 0);

  await asyncForEach(allDossiersApprenantsMigration, async (currentDossierApprenantMigration) => {
    try {
      // Rebuild effectifData from currentDossierApprenantMigration
      const organisme = await findOrganismeByUai(currentDossierApprenantMigration.uai_etablissement);

      const effectifData = {
        organisme_id: organisme._id.toString(),
        ...(await structureEffectifFromDossierApprenant(currentDossierApprenantMigration)),
      };

      // Call run engine with effectifData
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
          currentDossierApprenantMigration,
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
  logger.info(`--> ${allDossiersApprenantsMigration.length} dossiersApprenantsMigration initiaux`);
  logger.info(`--> ${nbEffectifsUpdated} effectifs maj`);

  await createJobEvent({
    jobname: JOB_NAME,
    date: new Date(),
    action: "finishing",
    data: {
      nbDossiersMigrationInitiaux: allDossiersApprenantsMigration.length,
    },
  });
};
