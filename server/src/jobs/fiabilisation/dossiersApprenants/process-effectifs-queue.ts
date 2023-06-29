/* eslint-disable @typescript-eslint/ban-types */
import { PromisePool } from "@supercharge/promise-pool";
import { ObjectId } from "mongodb";
import pPipe from "p-pipe";

import {
  insertEffectif,
  lockEffectif,
  updateEffectif,
  addEffectifComputedFields,
  mergeEffectifWithDefaults,
} from "@/common/actions/effectifs.actions";
import {
  buildNewHistoriqueStatutApprenant,
  findOrCreateOrganisme,
  mapEffectifQueueToEffectif,
  mapEffectifQueueToOrganisme,
  completeEffectifAddress,
  checkIfEffectifExists,
} from "@/common/actions/engine/engine.actions";
import { setOrganismeTransmissionDates } from "@/common/actions/organismes/organismes.actions";
import logger from "@/common/logger";
import { EffectifsQueue } from "@/common/model/@types/EffectifsQueue";
import { effectifsQueueDb } from "@/common/model/collections";
import { formatError } from "@/common/utils/errorUtils";
import { sleep } from "@/common/utils/timeUtils";
import dossierApprenantSchemaV1V2 from "@/common/validation/dossierApprenantSchemaV1V2";
import dossierApprenantSchemaV3 from "@/common/validation/dossierApprenantSchemaV3";

const sleepDuration = 10_000;

type Options = { id?: string; force?: boolean; v3?: boolean };

export const processEffectifsQueueEndlessly = async (options: Options) => {
  logger.info(`Process effectifs queue with options ${JSON.stringify(options)}`);

  // the inc is here to avoid infinite loop and memory leak
  let inc = 0;
  do {
    const { totalProcessed } = await processEffectifsQueue(options);
    if (sleepDuration && totalProcessed === 0 && !options.id) {
      await sleep(sleepDuration);
    }
    inc++;
  } while (!options.id && inc < 100);
};

export const processEffectifsQueue = async (options?: Options) => {
  const { id, force } = options || { id: undefined, force: false };

  const filter: Record<string, any> = force ? {} : { processed_at: { $exists: false } };
  if (id) {
    filter._id = id;
  }

  const result = await processItems(
    filter,
    effectifsQueueDb(),
    dossierApprenantSchemaV1V2(),
    mapEffectifQueueToEffectif,
    mapEffectifQueueToOrganisme
  );
  return result;
};

type ProcessItemsResult = {
  totalProcessed: number;
  totalValidItems: number;
  totalInvalidItems: number;
};
async function processItems(
  filter: any,
  collection: ReturnType<typeof effectifsQueueDb>,
  validationSchema: ReturnType<typeof dossierApprenantSchemaV1V2> | ReturnType<typeof dossierApprenantSchemaV3>,
  mapItemToEffectif: typeof mapEffectifQueueToEffectif,
  mapItemToOrganisme: typeof mapEffectifQueueToOrganisme
): Promise<ProcessItemsResult> {
  const total = await collection.countDocuments(filter);
  let totalValidItems = 0;

  const itemsToProcess = await collection.find(filter).sort({ created_at: 1 }).limit(100).toArray();

  logger.info(
    {
      collection: collection.collectionName,
      filter,
      count: itemsToProcess.length,
      total,
    },
    `${itemsToProcess.length}/${total} items à processer (dans la collection ${
      collection.collectionName
    }, avec filtre ${JSON.stringify(filter)}})`
  );
  await PromisePool.withConcurrency(10)
    .for(itemsToProcess)
    .process(async (effectifQueued, index) => {
      try {
        const startDate = new Date();
        let dataToUpdate: Partial<EffectifsQueue> = {};
        let result;
        try {
          result = await validationSchema
            .transform(async (data) => ({
              effectif: await pPipe(mapItemToEffectif, mergeEffectifWithDefaults, completeEffectifAddress)(data),
              organisme: await pPipe(mapItemToOrganisme, findOrCreateOrganisme, setOrganismeTransmissionDates)(data),
            }))
            .safeParseAsync(effectifQueued);
        } catch (err) {
          dataToUpdate.error = formatError(err).message;
        }

        if (!result) {
          // Do nothing
        } else if (!result.success) {
          const prettyValidationError = result.error?.issues.map(({ path, message }) => ({ message, path })) || [];
          dataToUpdate.validation_errors = prettyValidationError;
        } else {
          totalValidItems++;
          const { effectif: effectifData, organisme } = result.data as any;
          const effectif = {
            ...effectifData,
            organisme_id: organisme._id,
            _computed: addEffectifComputedFields(organisme),
          };

          try {
            let effectifId: ObjectId;
            // Gestion de l'effectif
            const found = await checkIfEffectifExists(effectif, ["id_erp_apprenant", "organisme_id", "annee_scolaire"]);

            // Gestion des maj d'effectif
            if (found) {
              effectifId = found._id;

              // Update de historique
              effectif.apprenant.historique_statut = buildNewHistoriqueStatutApprenant(
                found.apprenant.historique_statut,
                effectifData.apprenant?.historique_statut[0]?.valeur_statut,
                effectifData.apprenant?.historique_statut[0]?.date_statut
              );
              const updatedEffectif = await updateEffectif(effectifId, effectif);
              if (updatedEffectif) {
                await lockEffectif(updatedEffectif);
              }
            } else {
              const effectifCreated = await insertEffectif(effectif);
              effectifId = effectifCreated._id;
              await lockEffectif(effectifCreated);
            }

            dataToUpdate.effectif_id = effectifId;
          } catch (e: any) {
            const err = formatError(e);
            logger.error({ err }, `Error with item ${effectifQueued._id}: ${err.toString()}`);
            dataToUpdate.error = err.toString();
          }
        }

        await (collection as any).updateOne(
          { _id: effectifQueued._id },
          { $set: { ...dataToUpdate, processed_at: new Date() } }
        );

        const durationInMs = new Date().getTime() - startDate.getTime();
        logger.info(
          `#${index} Item ${
            effectifQueued._id
          } created at ${effectifQueued.created_at?.toISOString()} processed in ${durationInMs} ms`,
          { duration: durationInMs }
        );
        return { validItem: result.success, error: undefined };
      } catch (err: any) {
        logger.error({ err, index }, `an error occured while processing effectif queue item ${index}: ${err.message}`);
        logger.error(err);
        return { validItem: false, error: true };
      }
    });

  logger.info(`${itemsToProcess.length} items processés`);
  if (itemsToProcess.length > 0) {
    logger.info(`${totalValidItems} items valides`);
    logger.info(`${itemsToProcess.length - totalValidItems} items invalides`);
  }

  return {
    totalProcessed: itemsToProcess.length,
    totalValidItems,
    totalInvalidItems: itemsToProcess.length - totalValidItems,
  };
}
