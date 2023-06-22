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
  mapEffectifQueueToEffectif,
  mapEffectifQueueToOrganisme,
  completeEffectifAddress,
  checkIfEffectifExists,
} from "@/common/actions/engine/engine.actions";
import { isOrganismeFiableForCouple } from "@/common/actions/engine/engine.organismes.utils";
import {
  findOrganismeByUaiAndSiret,
  setOrganismeTransmissionDates,
} from "@/common/actions/organismes/organismes.actions";
import logger from "@/common/logger";
import { Effectif } from "@/common/model/@types";
import { EffectifsQueue } from "@/common/model/@types/EffectifsQueue";
import { effectifsQueueDb } from "@/common/model/collections";
import { formatError } from "@/common/utils/errorUtils";
import { sleep } from "@/common/utils/timeUtils";
import dossierApprenantSchemaV1V2 from "@/common/validation/dossierApprenantSchemaV1V2";

const sleepDuration = 10_000;

type Options = { id?: string; force?: boolean };

/**
 * Fonction de process de la file d'attente des effectifs en boucle
 * @param options
 */
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

/**
 * Fonction de process unitaire de la file d'attente des effectifs
 * @param options
 * @returns
 */
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

/**
 * Fonction de process des 100 derniers éléments de la queue
 * @param filter
 * @param collection
 * @param validationSchema
 * @param mapItemToEffectif
 * @param mapItemToOrganisme
 */
async function processItems(
  filter: any,
  collection: ReturnType<typeof effectifsQueueDb>,
  validationSchema: ReturnType<typeof dossierApprenantSchemaV1V2>,
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

        // Phase de contrôle et transformation d'une donnée de queue
        const { errors, effectif } = await controlAndTransformEffectifQueueItem(
          effectifQueued,
          mapItemToOrganisme,
          mapItemToEffectif,
          validationSchema
        );

        if (errors) {
          dataToUpdate.validation_errors = errors;
          // TODO gestion des erreurs de validation & erreurs
        } else if (effectif) {
          totalValidItems++;

          // Phase d'ajout ou update d'un effectif
          await createOrUpdateEffectif(effectif, dataToUpdate);
        }

        // MAJ de la queue pour indiquer que les données ont été traitées
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

        return { validItem: errors.length === 0, error: undefined };
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

/**
 *
 * @param effectifQueued
 * @param mapItemToOrganisme
 * @param mapItemToEffectif
 * @param validationSchema
 * @returns
 */
const controlAndTransformEffectifQueueItem = async (
  effectifQueued: EffectifsQueue,
  mapItemToOrganisme: typeof mapEffectifQueueToOrganisme,
  mapItemToEffectif: typeof mapEffectifQueueToEffectif,
  validationSchema: ReturnType<typeof dossierApprenantSchemaV1V2>
) => {
  let errors;
  let result;
  let effectif;

  try {
    const mappedOrganismeFields = mapItemToOrganisme(effectifQueued);

    // Contrôle de la fiabilité de l'organisme via les champs reçus
    if (!(await isOrganismeFiableForCouple(mappedOrganismeFields?.uai, mappedOrganismeFields?.siret))) {
      errors = [
        {
          message: `Organisme (uai : ${mappedOrganismeFields?.uai} et siret : ${mappedOrganismeFields?.siret}) non fiable`,
        },
      ];
    } else {
      // Vérification schéma & transformation en 2 objets effectif & organisme
      result = await validationSchema
        .transform(async (data) => ({
          effectif: await pPipe(mapItemToEffectif, mergeEffectifWithDefaults, completeEffectifAddress)(data),
          organisme: await pPipe(
            () => findOrganismeByUaiAndSiret(mappedOrganismeFields?.uai, mappedOrganismeFields?.siret),
            setOrganismeTransmissionDates
          )(data),
        }))
        .safeParseAsync(effectifQueued);

      if (result.error) {
        errors = result.error?.issues.map(({ path, message }) => ({ message, path })) || [];
      } else {
        // Complétion de l'objet effectif avec l'organisme id et le computed info
        const { effectif: effectifData, organisme } = result.data as any;
        effectif = {
          ...effectifData,
          organisme_id: organisme._id,
          _computed: addEffectifComputedFields(organisme),
        };
      }
    }
  } catch (err) {
    errors = formatError(err).message;
  }

  return { errors, effectif };
};

/**
 * Fonction de création ou de MAJ de l'effectif depuis la queue
 * @param effectif
 * @param dataToUpdate
 */
const createOrUpdateEffectif = async (effectif: Effectif, dataToUpdate: Partial<EffectifsQueue>) => {
  try {
    let effectifId: ObjectId;
    const found = await checkIfEffectifExists(effectif, ["id_erp_apprenant", "organisme_id", "annee_scolaire"]);

    // Gestion des MAJ d'effectif
    if (found) {
      effectifId = found._id;

      // Update de l'historique
      effectif.apprenant.historique_statut = buildNewHistoriqueStatutApprenant(
        found.apprenant.historique_statut,
        effectif.apprenant?.historique_statut[0]?.valeur_statut,
        effectif.apprenant?.historique_statut[0]?.date_statut
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
    dataToUpdate.error = err.toString();
  }
};
