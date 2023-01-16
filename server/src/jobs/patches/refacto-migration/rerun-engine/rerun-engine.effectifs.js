import { asyncForEach } from "../../../../common/utils/asyncUtils.js";
import logger from "../../../../common/logger.js";
import { createJobEvent } from "../../../../common/actions/jobEvents.actions.js";
import { dossiersApprenantsMigrationDb } from "../../../../common/model/collections.js";
import { runEngine } from "../../../../common/actions/engine/engine.actions.js";
import { structureEffectifFromDossierApprenant } from "../../../../common/actions/effectifs.actions.js";
import { findOrganismeByUai } from "../../../../common/actions/organismes/organismes.actions.js";

const JOB_NAME = "refacto-migration-rerun-effectifs-engine";
/**
 * Ce script effectue la migration de la collection cfas vers la nouvelle collection organismes
 */
export const reRunEngineEffectifs = async () => {
  logger.info("Relancement de l'engine des effectifs...");

  let nbEffectifsUpdated = 0;

  // Parse all distinct organismes in dossiersApprenantsMigration
  let allOrganismesInDossiersApprenantsMigration = await dossiersApprenantsMigrationDb().distinct("organisme_id");
  let allDossiersApprenantsMigration = await dossiersApprenantsMigrationDb().countDocuments();

  await asyncForEach(allOrganismesInDossiersApprenantsMigration, async (currentOrganismeId) => {
    const allDossiersApprenantsMigrationForOrganisme = await dossiersApprenantsMigrationDb()
      .find({ organisme_id: currentOrganismeId })
      .toArray();

    // Rerun for each dossiersApprenantMigration for organisme
    await asyncForEach(allDossiersApprenantsMigrationForOrganisme, async (currentDossierApprenantMigration) => {
      try {
        const effectifData = {
          organisme_id: currentOrganismeId.toString(),
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
    });

    await createJobEvent({
      jobname: JOB_NAME,
      date: new Date(),
      action: "finished-reRun-organisme",
      data: {
        currentOrganismeId,
        nbDossiersApprenantsForOrganisme: allDossiersApprenantsMigrationForOrganisme.length,
        totalDossiersApprenantsMigration: allDossiersApprenantsMigration,
        nbEffectifsUpdated: nbEffectifsUpdated,
      },
    });
  });

  // Log & stats
  logger.info(`--> ${nbEffectifsUpdated} effectifs maj`);

  await createJobEvent({
    jobname: JOB_NAME,
    date: new Date(),
    action: "finishing",
    data: {
      nbEffectifsUpdated: nbEffectifsUpdated,
    },
  });
};
