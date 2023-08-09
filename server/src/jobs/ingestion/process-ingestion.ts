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
import { formatError } from "@/common/utils/errorUtils";
import { AddPrefix, addPrefixToProperties } from "@/common/utils/miscUtils";
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

type ProcessItemsResult = {
  totalProcessed: number;
  totalValidItems: number;
  totalInvalidItems: number;
};

type EffectifQueueProcessorOptions = {
  force?: boolean;
  limit?: number;
  since?: Date;
};

/**
 * Fonction de process de la file d'attente des effectifs en boucle
 */
export const startEffectifQueueProcessor = async () => {
  logger.warn("starting EffectifQueue processor");
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const processingResult = await processEffectifsQueue();
    if (processingResult.totalProcessed === 0) {
      await sleep(5_000);
    }
  }
};

/**
 * Fonction de traitement des 100 premiers éléments de la file d'attente des effectifs
 * @param options
 * @returns true si des effectifs ont été traités
 */
export async function processEffectifsQueue(options?: EffectifQueueProcessorOptions): Promise<ProcessItemsResult> {
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

  const res = await PromisePool.withConcurrency(10)
    .for(itemsToProcess)
    .process(async (effectifQueued) => processEffectifQueueItem(effectifQueued));
  const totalValidItems = res.results.filter((valid) => valid).length;

  return {
    totalProcessed: itemsToProcess.length,
    totalValidItems: totalValidItems,
    totalInvalidItems: itemsToProcess.length - totalValidItems,
  };
}

export async function processEffectifQueueById(effectifQueueId: ObjectId): Promise<void> {
  const effectifQueue = await effectifsQueueDb().findOne({ _id: effectifQueueId });
  if (!effectifQueue) {
    throw Error(`effectifQueue(id=${effectifQueueId.toString()}) non trouvé`);
  }
  await processEffectifQueueItem(effectifQueue);
}

/**
 *
 * @param effectifQueue
 * @returns true si l'effectif est valide
 */
async function processEffectifQueueItem(effectifQueue: WithId<EffectifsQueue>): Promise<boolean> {
  let itemLogger = logger.child({
    _id: effectifQueue._id,
    siret: effectifQueue.siret_etablissement,
    uai: effectifQueue.uai_etablissement,
    created_at: effectifQueue.created_at,
  });
  const start = Date.now();
  try {
    // Phase de transformation d'une donnée de queue
    const { result, itemProcessingInfos } = await (effectifQueue.api_version === "v3"
      ? transformEffectifQueueV3ToEffectif(effectifQueue)
      : transformEffectifQueueV1V2ToEffectif(effectifQueue));

    // ajout des informations sur le traitement au logger
    itemLogger = itemLogger.child({ ...itemProcessingInfos, format: effectifQueue.api_version });

    if (result.success) {
      const { effectif, organisme } = result.data;

      // création ou mise à jour de l'effectif
      const [{ effectifId, itemProcessingInfos }] = await Promise.all([
        createOrUpdateEffectif(effectif),
        updateOrganismeLastTransmissionDate(organisme._id),
      ]);

      // ajout des informations sur le traitement au logger
      itemLogger = itemLogger.child(itemProcessingInfos);

      // MAJ de la queue pour indiquer que les données ont été traitées
      await effectifsQueueDb().updateOne(
        { _id: effectifQueue._id },
        {
          $set: {
            effectif_id: effectifId,
            organisme_id: organisme._id,
            updated_at: new Date(),
            processed_at: new Date(),
          },
          $unset: {
            error: 1,
            validation_errors: 1,
          },
        }
      );

      itemLogger.info({ duration: Date.now() - start }, "processed item");

      return true;
    } else {
      // MAJ de la queue pour indiquer que les données ont été traitées
      await effectifsQueueDb().updateOne(
        { _id: effectifQueue._id },
        {
          $set: {
            validation_errors: result.error?.issues.map(({ path, message }) => ({ message, path })) || [],
            updated_at: new Date(),
            processed_at: new Date(),
          },
          $unset: {
            error: 1,
          },
        }
      );

      itemLogger.error({ duration: Date.now() - start, err: result.error }, "item validation error");

      return false;
    }
  } catch (err: any) {
    itemLogger.error({ duration: Date.now() - start, err, detailedError: err }, "failed processing item");
    await effectifsQueueDb().updateOne(
      { _id: effectifQueue._id },
      {
        $set: {
          validation_errors: [],
          error: formatError(err).toString(),
          processed_at: new Date(),
        },
      }
    );
    return false;
  }
}

interface OrganismeSearchStatsInfos {
  id?: string;
  uai?: string;
  uai_corrige?: string;
  siret?: string;
  siret_corrige?: string;
  fiabilisation?: FiabilisationUaiSiret["type"] | "INCONNU";
  found?: boolean;
}

type ItemProcessingInfos = {
  effectif_id?: string;
  effectif_new?: boolean;
  formation_cfd?: string;
  formation_found?: boolean;
} & AddPrefix<"organisme_", OrganismeSearchStatsInfos> & // v2
  // v3
  AddPrefix<"organisme_lieu_", OrganismeSearchStatsInfos> &
  AddPrefix<"organisme_formateur_", OrganismeSearchStatsInfos> &
  AddPrefix<"organisme_responsable_", OrganismeSearchStatsInfos>;

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
            const { organisme, stats } = await findOrganismeWithStats(
              effectifQueued?.etablissement_lieu_de_formation_uai,
              effectifQueued?.etablissement_lieu_de_formation_siret
            );
            Object.assign(itemProcessingInfos, addPrefixToProperties("organisme_lieu_", stats));
            return organisme;
          })(),
          (async () => {
            const { organisme, stats } = await findOrganismeWithStats(
              effectifQueued?.etablissement_formateur_uai,
              effectifQueued?.etablissement_formateur_siret,
              { _id: 1 }
            );
            Object.assign(itemProcessingInfos, addPrefixToProperties("organisme_formateur_", stats));
            return organisme;
          })(),
          (async () => {
            const { organisme, stats } = await findOrganismeWithStats(
              effectifQueued?.etablissement_responsable_uai,
              effectifQueued?.etablissement_responsable_siret,
              { _id: 1 }
            );
            Object.assign(itemProcessingInfos, addPrefixToProperties("organisme_responsable_", stats));
            return organisme;
          })(),
          (async () => {
            const formation = await formationsCatalogueDb().findOne({ cfd: effectifQueued.formation_cfd });
            itemProcessingInfos.formation_cfd = effectifQueued.formation_cfd;
            itemProcessingInfos.formation_found = !!formation;
          })(),
        ]);

        if (!organismeLieu) {
          ctx.addIssue({
            code: ZodIssueCode.custom,
            message: "organisme non trouvé",
            path: ["etablissement_lieu_de_formation_uai", "etablissement_lieu_de_formation_siret"],
            params: {
              uai: effectifQueued.etablissement_lieu_de_formation_uai,
              siret: effectifQueued.etablissement_lieu_de_formation_siret,
            },
          });
          return NEVER;
        }
        if (!organismeFormateur) {
          ctx.addIssue({
            code: ZodIssueCode.custom,
            message: "organisme formateur non trouvé",
            path: ["etablissement_formateur_uai", "etablissement_formateur_siret"],
            params: {
              uai: effectifQueued.etablissement_formateur_uai,
              siret: effectifQueued.etablissement_formateur_siret,
            },
          });
          return NEVER;
        }
        if (!organismeResponsable) {
          ctx.addIssue({
            code: ZodIssueCode.custom,
            message: "organisme responsable non trouvé",
            path: ["etablissement_responsable_uai", "etablissement_responsable_siret"],
            params: {
              uai: effectifQueued.etablissement_responsable_uai,
              siret: effectifQueued.etablissement_responsable_siret,
            },
          });
          return NEVER;
        }
        // désactivé si non bloquant
        // if (!formation) {
        //   ctx.addIssue({
        //     code: ZodIssueCode.custom,
        //     message: "formation non trouvée dans le catalogue",
        //     params: {
        //       cfd: effectifQueued.formation_cfd,
        //     },
        //   });
        // }

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
            const { organisme, stats } = await findOrganismeWithStats(
              effectifQueued.uai_etablissement,
              effectifQueued.siret_etablissement
            );
            Object.assign(itemProcessingInfos, addPrefixToProperties("organisme_", stats));
            return organisme;
          })(),
          (async () => {
            const formation = await formationsCatalogueDb().findOne({ cfd: effectifQueued.id_formation });
            itemProcessingInfos.formation_cfd = effectifQueued.id_formation;
            itemProcessingInfos.formation_found = !!formation;
          })(),
        ]);

        if (!organisme) {
          ctx.addIssue({
            code: ZodIssueCode.custom,
            message: "organisme non trouvé",
            path: ["uai_etablissement", "siret_etablissement"],
            params: {
              uai: effectifQueued.uai_etablissement,
              siret: effectifQueued.siret_etablissement,
            },
          });
          return NEVER;
        }
        // désactivé si non bloquant
        // if (!formation) {
        //   ctx.addIssue({
        //     code: ZodIssueCode.custom,
        //     message: "formation non trouvée dans le catalogue",
        //     params: {
        //       cfd: effectifQueued.id_formation,
        //     },
        //   });
        // }

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

async function findOrganismeWithStats(
  uai_etablissement: string,
  siret_etablissement?: string,
  projection = {}
): Promise<{ organisme: WithId<Organisme> | null; stats: OrganismeSearchStatsInfos }> {
  const stats: OrganismeSearchStatsInfos = {};

  // 1. On essaie de corriger l'UAI et le SIRET avec la collection fiabilisationUaiSiret
  const fiabilisationResult = await fiabilisationUaiSiretDb().findOne({
    uai: uai_etablissement,
    siret: siret_etablissement,
  });
  let uai: string;
  let siret: string;
  if (fiabilisationResult?.type === "A_FIABILISER") {
    // FIXME seulement 4 en prod !!! potentiellement prendre plus de choses
    uai = fiabilisationResult.uai_fiable as string;
    siret = fiabilisationResult.siret_fiable as string;
  } else {
    uai = uai_etablissement;
    siret = siret_etablissement as string;
  }
  // TODO/FIXME peut-être vérifier dans fiabilisationUaiSiretDb, avec couple uai/siret, sinon uai, sinon siret ???

  // 2. On cherche l'organisme avec le couple uai/siret
  const organisme = await findOrganismeByUaiAndSiret(uai, siret, projection);

  // 3. Des indicateurs pour apporter des informations sur le traitement
  stats.uai = uai_etablissement;
  if (uai !== uai_etablissement) {
    stats.uai_corrige = uai;
  }
  stats.siret = siret_etablissement;
  if (siret !== siret_etablissement) {
    stats.siret_corrige = siret;
  }
  stats.fiabilisation = fiabilisationResult?.type || "INCONNU";
  stats.found = !!organisme;
  if (organisme) {
    stats.id = organisme._id.toString();
  }
  return { organisme, stats };
}
