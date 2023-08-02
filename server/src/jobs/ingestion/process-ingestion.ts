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
  completeEffectifAddress,
  checkIfEffectifExists,
} from "@/common/actions/engine/engine.actions";
import {
  findOrganismeFiableByUaiAndSiret,
  setOrganismeTransmissionDates,
} from "@/common/actions/organismes/organismes.actions";
import logger from "@/common/logger";
import { Effectif } from "@/common/model/@types";
import { EffectifsQueue } from "@/common/model/@types/EffectifsQueue";
import { effectifsQueueDb } from "@/common/model/collections";
import { formatError } from "@/common/utils/errorUtils";
import { sleep } from "@/common/utils/timeUtils";
import dossierApprenantSchemaV1V2 from "@/common/validation/dossierApprenantSchemaV1V2";
import dossierApprenantSchemaV3 from "@/common/validation/dossierApprenantSchemaV3";

const sleepDuration = 10_000;
const NB_ITEMS_TO_PROCESS = 100;
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
    filter._id = new ObjectId(id);
  }

  const result = await processItems(filter);
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
 */
async function processItems(filter: any): Promise<ProcessItemsResult> {
  const total = await effectifsQueueDb().countDocuments(filter);
  let totalValidItems = 0;

  const itemsToProcess = await effectifsQueueDb()
    .find(filter)
    .sort({ created_at: 1 })
    .limit(NB_ITEMS_TO_PROCESS)
    .toArray();

  logger.info(
    { filter, count: itemsToProcess.length, total },
    `${itemsToProcess.length}/${total} items à traiter (avec filtre ${JSON.stringify(filter)}})`
  );

  await PromisePool.withConcurrency(10)
    .for(itemsToProcess)
    .process(async (effectifQueued, index) => {
      try {
        const startDate = new Date();
        let effectifQueueToUpdate: Partial<EffectifsQueue> = {};

        // Phase de transformation d'une donnée de queue
        const { effectif } = await transformEffectifQueueItem(effectifQueued, effectifQueueToUpdate);

        if (effectif) {
          totalValidItems++;

          // Phase d'ajout ou update d'un effectif
          await createOrUpdateEffectif(effectif, effectifQueueToUpdate);
        }

        // MAJ de la queue pour indiquer que les données ont été traitées
        await effectifsQueueDb().updateOne(
          { _id: effectifQueued._id },
          { $set: { ...effectifQueueToUpdate, processed_at: new Date() } }
        );

        const durationInMs = new Date().getTime() - startDate.getTime();
        logger.info(
          `#${index} Item ${
            effectifQueued._id
          } created at ${effectifQueued.created_at?.toISOString()} processed in ${durationInMs} ms`,
          { duration: durationInMs }
        );

        return {
          validItem: effectifQueueToUpdate.validation_errors?.length === 0 && !effectifQueueToUpdate.error,
          error: undefined,
        };
      } catch (err: any) {
        logger.error({ err, index }, `an error occured while processing effectif queue item ${index}: ${err.message}`);
        logger.error(err);
        return { validItem: false, error: true };
      }
    });

  logger.info(`${itemsToProcess.length} items traités`);
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

const transformEffectifQueueItem = async (
  effectifQueued: EffectifsQueue,
  effectifQueueToUpdate: Partial<EffectifsQueue>
): Promise<{ effectif: Effectif | undefined }> => {
  let result;
  let effectif: Effectif | undefined;

  try {
    // Vérification schéma & transformation en 2 objets effectif & organisme.

    // Actuellement, on réutilise la validation de schéma, ce qui semble inutile,
    // étant donné que la donnée a déjà été validée lors de l'insertion dans la queue.
    // La seule différence est que c'est le résultat de la donnée transformée qui est retournée ici
    // alors que c'est la donnée brute qui est retournée lors de l'insertion dans la queue.
    if (effectifQueued.api_version === "v3") {
      result = await dossierApprenantSchemaV3()
        .transform(async (data) => ({
          effectif: await pPipe(mapEffectifQueueToEffectif, mergeEffectifWithDefaults, completeEffectifAddress)(data),
          organisme: await pPipe(
            () =>
              findOrganismeFiableByUaiAndSiret(
                effectifQueued?.etablissement_lieu_de_formation_uai,
                effectifQueued?.etablissement_lieu_de_formation_siret
              ),
            setOrganismeTransmissionDates
          )(data),
          organisme_formateur: await findOrganismeFiableByUaiAndSiret(
            effectifQueued?.etablissement_formateur_uai,
            effectifQueued?.etablissement_formateur_siret,
            { _id: 1 }
          ),
          organisme_responsable: await findOrganismeFiableByUaiAndSiret(
            effectifQueued?.etablissement_responsable_uai,
            effectifQueued?.etablissement_responsable_siret,
            { _id: 1 }
          ),
        }))
        .safeParseAsync(effectifQueued);
    } else {
      result = await dossierApprenantSchemaV1V2()
        .transform(async (data) => ({
          effectif: await pPipe(mapEffectifQueueToEffectif, mergeEffectifWithDefaults, completeEffectifAddress)(data),
          organisme: await pPipe(
            () =>
              findOrganismeFiableByUaiAndSiret(effectifQueued?.uai_etablissement, effectifQueued?.siret_etablissement),
            setOrganismeTransmissionDates
          )(data),
        }))
        .safeParseAsync(effectifQueued);
    }

    if (result.error) {
      effectifQueueToUpdate.validation_errors =
        result.error?.issues.map(({ path, message }) => ({ message, path })) || [];
    } else if (effectifQueued.api_version === "v3") {
      const { effectif: effectifData, organisme, organisme_formateur, organisme_responsable } = result.data as any;

      // Complétion de l'objet effectif avec l'organisme id et le computed info
      effectif = {
        ...effectifData,
        organisme_id: organisme._id,
        organisme_formateur_id: organisme_formateur?._id,
        organisme_responsable_id: organisme_responsable?._id,
        _computed: addEffectifComputedFields(organisme),
      };

      // Complétion de l'objet dans la queue avec l'organisme id
      effectifQueueToUpdate.organisme_id = organisme._id;
    } else {
      const { effectif: effectifData, organisme } = result.data as any;

      // Complétion de l'objet effectif avec l'organisme id et le computed info
      effectif = {
        ...effectifData,
        organisme_id: organisme._id,
        _computed: addEffectifComputedFields(organisme),
      };

      // Complétion de l'objet dans la queue avec l'organisme id
      effectifQueueToUpdate.organisme_id = organisme._id;
    }
  } catch (err) {
    effectifQueueToUpdate.error = formatError(err).message;
  }

  return { effectif };
};

/**
 * Fonction de création ou de MAJ de l'effectif depuis la queue
 * @param effectif
 * @param dataToUpdate
 */
const createOrUpdateEffectif = async (effectif: Effectif, dataToUpdate: Partial<EffectifsQueue>) => {
  try {
    let effectifId: ObjectId;
    const found = await checkIfEffectifExists(effectif);

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

    // Complétion de l'objet dans la queue avec l'effectif id
    dataToUpdate.effectif_id = effectifId;
  } catch (e: any) {
    const err = formatError(e);
    dataToUpdate.error = err.toString();
  }
};
