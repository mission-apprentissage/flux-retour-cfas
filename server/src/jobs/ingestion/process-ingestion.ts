/* eslint-disable @typescript-eslint/ban-types */
import { PromisePool } from "@supercharge/promise-pool";
import { Filter, ObjectId, WithId } from "mongodb";
import { NEVER, SafeParseReturnType, ZodIssueCode } from "zod";

import { lockEffectif, addEffectifComputedFields, mergeEffectifWithDefaults } from "@/common/actions/effectifs.actions";
import {
  buildNewHistoriqueStatutApprenant,
  mapEffectifQueueToEffectif,
  completeEffectifAddress,
  checkIfEffectifExists,
} from "@/common/actions/engine/engine.actions";
import {
  findOrganismeByUaiAndSiret,
  updateOrganismeLastTransmissionDate,
} from "@/common/actions/organismes/organismes.actions";
import parentLogger from "@/common/logger";
import { Effectif, FiabilisationUaiSiret, Organisme } from "@/common/model/@types";
import { EffectifsQueue } from "@/common/model/@types/EffectifsQueue";
import {
  effectifsDb,
  effectifsQueueDb,
  fiabilisationUaiSiretDb,
  formationsCatalogueDb,
} from "@/common/model/collections";
import { sleep } from "@/common/utils/timeUtils";
import dossierApprenantSchemaV1V2, {
  DossierApprenantSchemaV1V2ZodType,
} from "@/common/validation/dossierApprenantSchemaV1V2";
import dossierApprenantSchemaV3, {
  DossierApprenantSchemaV3ZodType,
} from "@/common/validation/dossierApprenantSchemaV3";

const logger = parentLogger.child({
  module: "processor",
});

type EffectifQueueProcessorOptions = {
  force?: boolean;
  limit?: number;
  since: Date;
};

/**
 * Fonction de process de la file d'attente des effectifs en boucle
 */
export const startEffectifQueueProcessor = async () => {
  logger.warn("starting EffectifQueue processor");
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const hasProcessedItems = await processEffectifsQueue();
    if (!hasProcessedItems) {
      await sleep(5_000);
    }
  }
};

/**
 * Fonction de traitement des 100 premiers éléments de la file d'attente des effectifs
 * @param options
 * @returns true si des effectifs ont été traités
 */
export async function processEffectifsQueue(options?: EffectifQueueProcessorOptions): Promise<boolean> {
  const filter: Filter<EffectifsQueue> = {
    ...(options?.force ? {} : { processed_at: { $exists: false } }),
    ...(options?.since ? { created_at: { $gt: options.since } } : {}),
  };
  const total = await effectifsQueueDb().countDocuments(filter);
  const itemsToProcess = await effectifsQueueDb()
    .find(filter)
    .sort({ created_at: 1 })
    .limit(options?.limit ?? 100)
    .toArray();

  logger.info({ filter, count: itemsToProcess.length, total }, "traitement des effectifsQueue");

  await PromisePool.withConcurrency(10)
    .for(itemsToProcess)
    .process(async (effectifQueued) => {
      await processEffectifQueueItem(effectifQueued);
      // TODO peut-être try catch ici, dépendra de la CLI pour un effectif
    });

  return itemsToProcess.length > 0;
}

export async function processEffectifQueueById(effectifQueueId: ObjectId): Promise<void> {
  const effectifQueue = await effectifsQueueDb().findOne({ _id: effectifQueueId });
  if (!effectifQueue) {
    throw Error(`effectifQueue(id=${effectifQueueId.toString()}) non trouvé`);
  }
  await processEffectifQueueItem(effectifQueue);
}

async function processEffectifQueueItem(effectifQueue: WithId<EffectifsQueue>): Promise<void> {
  let itemLogger = logger.child({
    _id: effectifQueue._id,
    siret: effectifQueue.siret_etablissement,
    uai: effectifQueue.uai_etablissement,
    created_at: effectifQueue.created_at,
  });
  // itemLogger.debug("process item");
  const start = Date.now();
  try {
    // let effectifQueueToUpdate: Partial<EffectifsQueue> = {};

    // Phase de transformation d'une donnée de queue

    const { result, itemProcessingInfos } = await (effectifQueue.api_version === "v3"
      ? transformEffectifQueueV3ToEffectif(effectifQueue)
      : transformEffectifQueueV1V2ToEffectif(effectifQueue));

    // ajout des informations sur le traitement au logger
    itemLogger = itemLogger.child(itemProcessingInfos);

    let effectifQueueUpdate: Pick<EffectifsQueue, "organisme_id" | "effectif_id" | "validation_errors">;

    if (result.success) {
      const { effectif, organisme } = result.data;

      // céation ou mise à jour de l'effectif
      const [{ effectifId, itemProcessingInfos }] = await Promise.all([
        createOrUpdateEffectif(effectif),
        updateOrganismeLastTransmissionDate(organisme._id),
      ]);

      // ajout des informations sur le traitement au logger
      itemLogger = itemLogger.child(itemProcessingInfos);

      effectifQueueUpdate = {
        effectif_id: effectifId,
        organisme_id: organisme._id,
        validation_errors: [],
      };
    } else {
      itemLogger.error({ duration: Date.now() - start, err: result.error }, "item validation error");
      effectifQueueUpdate = {
        validation_errors: result.error?.issues.map(({ path, message }) => ({ message, path })) || [],
      };
    }

    // MAJ de la queue pour indiquer que les données ont été traitées
    await effectifsQueueDb().updateOne(
      { _id: effectifQueue._id },
      {
        $set: {
          ...effectifQueueUpdate,
          updated_at: new Date(),
          processed_at: new Date(),
        },
        $unset: {
          error: 1,
        },
      }
    );
    // await sleep(3000);

    // TODO infos sur le siret corrigé
    itemLogger.info({ duration: Date.now() - start }, "processed item");
  } catch (err: any) {
    itemLogger.error({ duration: Date.now() - start, err, detailedError: err }, "failed processing item");
    await effectifsQueueDb().updateOne(
      { _id: effectifQueue._id },
      {
        $set: {
          validation_errors: [],
          error: err.message,
          processed_at: new Date(),
        },
      }
    );
  }
}

interface ItemProcessingInfos {
  effectif_id?: string;
  effectif_new?: boolean;
  organisme_id?: string;
  organisme_uai?: string;
  organisme_uai_corrige?: string;
  organisme_siret?: string;
  organisme_siret_corrige?: string;
  organisme_fiabilisation?: FiabilisationUaiSiret["type"] | "INCONNU";
  organisme_found?: boolean;
  formation_cfd?: string;
  formation_found?: boolean;
}

async function transformEffectifQueueV3ToEffectif(rawEffectifQueued: EffectifsQueue): Promise<{
  result: SafeParseReturnType<EffectifsQueue, { effectif: Effectif; organisme: WithId<Organisme> }>;
  itemProcessingInfos: ItemProcessingInfos;
}> {
  const itemProcessingInfos: ItemProcessingInfos = {};
  return {
    result: await dossierApprenantSchemaV3()
      .transform(async (effectifQueued, ctx) => {
        const [effectif, organismeLieu, organismeFormateur, organismeResponsable] = await Promise.all([
          (async () => {
            return await transformEffectifQueueToEffectif(effectifQueued as any);
          })(),
          (async () => {
            return await findOrganismeByUaiAndSiret(
              effectifQueued?.etablissement_lieu_de_formation_uai,
              effectifQueued?.etablissement_lieu_de_formation_siret
            );
          })(),
          (async () => {
            return await findOrganismeByUaiAndSiret(
              effectifQueued?.etablissement_formateur_uai,
              effectifQueued?.etablissement_formateur_siret,
              { _id: 1 }
            );
          })(),
          (async () => {
            return await findOrganismeByUaiAndSiret(
              effectifQueued?.etablissement_responsable_uai,
              effectifQueued?.etablissement_responsable_siret,
              { _id: 1 }
            );
          })(),
          (async () => {
            const formation = await formationsCatalogueDb().findOne({ cfd: effectifQueued.formation_cfd });
            if (!formation) {
              ctx.addIssue({
                code: ZodIssueCode.custom,
                message: "formation non trouvée dans le catalogue",
                params: {
                  cfd: effectifQueued.formation_cfd,
                },
              });
            }
          })(),
        ]);

        // TODO appel fiabilisation
        // Récupération du couple fiable depuis l'UAI / SIRET

        if (!organismeLieu) {
          ctx.addIssue({
            code: ZodIssueCode.custom,
            message: "organisme non trouvé",
          });
          // throw new Error("organisme non trouvé");
          return NEVER;
        }

        return {
          effectif: {
            ...effectif,
            organisme_id: organismeLieu?._id,
            organisme_formateur_id: organismeFormateur?._id,
            organisme_responsable_id: organismeResponsable?._id,
            _computed: addEffectifComputedFields(organismeLieu),
          },
          organisme: organismeLieu,
        };
      })
      .safeParseAsync(rawEffectifQueued),
    itemProcessingInfos,
  };
}

async function transformEffectifQueueV1V2ToEffectif(rawEffectifQueued: EffectifsQueue): Promise<{
  result: SafeParseReturnType<EffectifsQueue, { effectif: Effectif; organisme: WithId<Organisme> }>;
  itemProcessingInfos: ItemProcessingInfos;
}> {
  const itemProcessingInfos: ItemProcessingInfos = {};
  return {
    result: await dossierApprenantSchemaV1V2()
      .transform(async (effectifQueued, ctx) => {
        const [effectif, organisme] = await Promise.all([
          (async () => {
            return await transformEffectifQueueToEffectif(effectifQueued);
          })(),
          (async () => {
            // 1. On essaie de corriger l'UAI et le SIRET avec la collection fiabilisationUaiSiret
            const result = await fiabilisationUaiSiretDb().findOne({
              uai: effectifQueued.uai_etablissement,
              siret: effectifQueued.siret_etablissement,
            });
            let uai: string;
            let siret: string;
            if (!result) {
              uai = effectifQueued.uai_etablissement;
              siret = effectifQueued.siret_etablissement as string;
            } else if (result.type === "A_FIABILISER") {
              // FIXME seulement 4 en prod !!! potentiellement prendre plus de choses
              uai = result.uai_fiable as string;
              siret = result.siret_fiable as string;
            } else {
              uai = effectifQueued.uai_etablissement;
              siret = effectifQueued.siret_etablissement as string;
            }
            // TODO/FIXME peut-être vérifier dans fiabilisationUaiSiretDb, avec couple uai/siret, sinon uai, sinon siret ???

            // 2. On cherche l'organisme avec le couple uai/siret
            const organisme = await findOrganismeByUaiAndSiret(uai, siret);

            // 3. Des indicateurs pour apporter des informations sur le traitement
            itemProcessingInfos.organisme_uai = effectifQueued.uai_etablissement;
            if (uai !== effectifQueued.uai_etablissement) {
              itemProcessingInfos.organisme_uai_corrige = uai;
            }
            itemProcessingInfos.organisme_siret = effectifQueued.siret_etablissement;
            if (siret !== effectifQueued.siret_etablissement) {
              itemProcessingInfos.organisme_siret_corrige = siret;
            }
            itemProcessingInfos.organisme_fiabilisation = result?.type || "INCONNU";
            itemProcessingInfos.organisme_found = !!organisme;
            if (organisme) {
              itemProcessingInfos.organisme_id = organisme._id.toString();
            }
            return organisme;
          })(),
          (async () => {
            const formation = await formationsCatalogueDb().findOne({ cfd: effectifQueued.id_formation });
            if (!formation) {
              ctx.addIssue({
                code: ZodIssueCode.custom,
                message: "formation non trouvée dans le catalogue",
                params: {
                  cfd: effectifQueued.id_formation,
                },
              });
            }
            itemProcessingInfos.formation_cfd = effectifQueued.id_formation;
            itemProcessingInfos.formation_found = !!formation;
          })(),
        ]);

        if (!organisme) {
          ctx.addIssue({
            code: ZodIssueCode.custom,
            message: "organisme non trouvé",
            params: {
              uai: effectifQueued.uai_etablissement,
              siret: effectifQueued.siret_etablissement,
            },
          });
          return NEVER;
        }

        return {
          effectif: {
            ...effectif,
            organisme_id: organisme?._id,
            _computed: addEffectifComputedFields(organisme),
          },
          organisme: organisme,
        };
      })
      .safeParseAsync(rawEffectifQueued),
    itemProcessingInfos,
  };
}

async function transformEffectifQueueToEffectif(
  effectifQueue: DossierApprenantSchemaV1V2ZodType | DossierApprenantSchemaV3ZodType
): Promise<Effectif> {
  return await completeEffectifAddress(
    mergeEffectifWithDefaults(mapEffectifQueueToEffectif(effectifQueue as any) as any)
  );
}

/**
 * Fonction de création ou de MAJ de l'effectif depuis la queue
 * @param effectif
 * @returns
 */
const createOrUpdateEffectif = async (
  effectif: Effectif
): Promise<{ effectifId: ObjectId; itemProcessingInfos: ItemProcessingInfos }> => {
  const itemProcessingInfos: ItemProcessingInfos = {};
  let effectifDb = await checkIfEffectifExists(effectif);
  itemProcessingInfos.effectif_new = !effectifDb;

  // Gestion des MAJ d'effectif
  if (effectifDb) {
    // Update de l'historique
    effectif.apprenant.historique_statut = buildNewHistoriqueStatutApprenant(
      effectifDb.apprenant.historique_statut,
      effectif.apprenant?.historique_statut[0]?.valeur_statut,
      effectif.apprenant?.historique_statut[0]?.date_statut
    );
    await effectifsDb().findOneAndUpdate(
      { _id: effectifDb._id },
      {
        $set: {
          ...effectif,
          updated_at: new Date(),
        },
      }
    );
  } else {
    const { insertedId } = await effectifsDb().insertOne(effectif);
    effectifDb = { _id: insertedId, ...effectif };
  }
  itemProcessingInfos.effectif_id = effectifDb._id.toString();

  // lock de tous les champs mis à jour par l'API pour ne pas permettre la modification côté UI
  // TODO vérifier que ça marche bien
  await lockEffectif(effectifDb);

  return { effectifId: effectifDb._id, itemProcessingInfos };
};
