import { captureException, getCurrentHub, runWithAsyncContext } from "@sentry/node";
import { PromisePool } from "@supercharge/promise-pool";
import Boom from "boom";
import { Filter, ObjectId, WithId } from "mongodb";
import { SOURCE_APPRENANT } from "shared/constants";
import { FiabilisationUaiSiret } from "shared/models/data/@types";
import { IEffectif } from "shared/models/data/effectifs.model";
import { IEffectifQueue } from "shared/models/data/effectifsQueue.model";
import { IOrganisme } from "shared/models/data/organismes.model";
import { NEVER, SafeParseReturnType, ZodIssueCode } from "zod";

import { lockEffectif, addComputedFields, mergeEffectifWithDefaults } from "@/common/actions/effectifs.actions";
import {
  buildNewHistoriqueStatutApprenant,
  mapEffectifQueueToEffectif,
  completeEffectifAddress,
  checkIfEffectifExists,
} from "@/common/actions/engine/engine.actions";
import { getNiveauFormationFromLibelle } from "@/common/actions/formations.actions";
import {
  findOrganismeByUaiAndSiret,
  updateOrganismeTransmission,
  updateOrganismesHasTransmittedWithHierarchy,
} from "@/common/actions/organismes/organismes.actions";
import parentLogger from "@/common/logger";
import {
  effectifsDb,
  effectifsQueueDb,
  fiabilisationUaiSiretDb,
  formationsCatalogueDb,
  organismesDb,
} from "@/common/model/collections";
import { sleep } from "@/common/utils/asyncUtils";
import { formatError } from "@/common/utils/errorUtils";
import { mergeIgnoringNullPreferringNewArray } from "@/common/utils/mergeIgnoringNullPreferringNewArray";
import { AddPrefix, addPrefixToProperties } from "@/common/utils/miscUtils";
import { validateContrat } from "@/common/validation/contratsDossierApprenantSchemaV3";
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
export const startEffectifQueueProcessor = async (signal: AbortSignal) => {
  logger.warn("starting EffectifQueue processor");
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const processingResult = await processEffectifsQueue();
    if (processingResult.totalProcessed === 0) {
      await sleep(5_000, signal);
    }
    if (signal.aborted) {
      return;
    }
  }
};

/**
 * Fonction de traitement des 100 premiers éléments de la file d'attente des effectifs
 * @returns true si des effectifs ont été traités
 */
export async function processEffectifsQueue(options?: EffectifQueueProcessorOptions): Promise<ProcessItemsResult> {
  const filter: Filter<IEffectifQueue> = {
    ...(options?.force ? {} : { processed_at: { $exists: false } }),
    ...(options?.since ? { created_at: { $gt: options.since } } : {}),
  };
  const itemsToProcess = await effectifsQueueDb()
    .find(filter)
    .sort({ created_at: 1 })
    .limit(options?.limit ?? 100)
    .toArray();

  logger.info({ filter, count: itemsToProcess.length }, "traitement des effectifsQueue");

  const res = await PromisePool.withConcurrency(10)
    .for(itemsToProcess)
    .process(async (effectifQueued) => executeProcessEffectifQueueItem(effectifQueued));
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
  await executeProcessEffectifQueueItem(effectifQueue);
}

export function executeProcessEffectifQueueItem(effectifQueue: WithId<IEffectifQueue>) {
  return runWithAsyncContext(async () => {
    const hub = getCurrentHub();
    const transaction = hub?.startTransaction({
      name: `QUEUE: Item`,
      op: "queue.item",
    });
    hub?.configureScope((scope) => {
      scope.setSpan(transaction);
      scope.setTag("erp", effectifQueue.source);
      scope.setTag("api_version", effectifQueue.api_version);
      scope.setUser({ id: effectifQueue.source_organisme_id ?? undefined });
      const ctx = {
        source_organisme_id: effectifQueue.source_organisme_id,
        updated_at: effectifQueue.updated_at,
        created_at: effectifQueue.created_at,
        processed_at: effectifQueue.processed_at,
        validation_errors: effectifQueue.validation_errors,
        effectif_id: effectifQueue.effectif_id,
        id_erp_apprenant: effectifQueue.id_erp_apprenant,
      };
      scope.setContext("ctx", ctx);
    });
    const start = Date.now();
    try {
      return await processEffectifQueueItem(effectifQueue);
    } finally {
      transaction?.setMeasurement("queue.execute", Date.now() - start, "millisecond");
      transaction?.finish();
    }
  });
}

/**
 * @returns true si l'effectif est valide
 */
async function processEffectifQueueItem(effectifQueue: WithId<IEffectifQueue>): Promise<boolean> {
  const ctx = {
    _id: effectifQueue._id,
    siret: effectifQueue.siret_etablissement,
    uai: effectifQueue.uai_etablissement,
    created_at: effectifQueue.created_at,
  };
  let itemLogger = logger.child(ctx);
  const start = Date.now();
  try {
    // Phase de transformation d'une donnée de queue
    const { result, itemProcessingInfos, organismeTarget } = await (effectifQueue.api_version === "v3"
      ? transformEffectifQueueV3ToEffectif(effectifQueue)
      : transformEffectifQueueV1V2ToEffectif(effectifQueue));
    // ajout des informations sur le traitement au logger
    itemLogger = itemLogger.child({ ...itemProcessingInfos, format: effectifQueue.api_version });

    if (result.success) {
      const { effectif, organisme } = result.data;

      // création ou mise à jour de l'effectif
      const [{ effectifId, itemProcessingInfos }] = await Promise.all([
        createOrUpdateEffectif(effectif),
        updateOrganismeTransmission(
          organisme,
          effectif.source,
          effectifQueue.api_version,
          effectifQueue.source_organisme_id
        ),
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
    }
    await handleDECAMechanism(organismeTarget);
    return result.success;
  } catch (err: any) {
    const error = Boom.internal("failed processing item", ctx);
    error.cause = err;
    captureException(err);
    itemLogger.error({ duration: Date.now() - start, err: error, detailedError: err }, error.message);
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

async function transformEffectifQueueV3ToEffectif(rawEffectifQueued: IEffectifQueue): Promise<{
  result: SafeParseReturnType<IEffectifQueue, { effectif: IEffectif; organisme: IOrganisme }>;
  itemProcessingInfos: ItemProcessingInfos;
  organismeTarget: IOrganisme;
}> {
  const itemProcessingInfos: ItemProcessingInfos = {};
  let organismeTarget: any;

  const result = await dossierApprenantSchemaV3()
    .transform(async (effectifQueued, ctx) => {
      const [effectif, organismeLieu, organismeFormateur, organismeResponsable, formation] = await Promise.all([
        (async () => {
          return await transformEffectifQueueToEffectif(effectifQueued);
        })(),
        (async () => {
          const { organisme, stats } = await findOrganismeWithStats(
            effectifQueued?.etablissement_lieu_de_formation_uai,
            effectifQueued?.etablissement_lieu_de_formation_siret
          );
          organismeTarget = organisme;
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
          if (!effectifQueued.formation_cfd) {
            return null;
          }

          const formationFromCatalogue = await formationsCatalogueDb().findOne({ cfd: effectifQueued.formation_cfd });
          itemProcessingInfos.formation_cfd = effectifQueued.formation_cfd;
          itemProcessingInfos.formation_found = !!formationFromCatalogue;
          return formationFromCatalogue;
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
      }
      validateContrat(effectifQueued, "", ctx);
      validateContrat(effectifQueued, "_2", ctx);
      validateContrat(effectifQueued, "_3", ctx);
      validateContrat(effectifQueued, "_4", ctx);

      if (!organismeLieu || !organismeFormateur || !organismeResponsable) {
        return NEVER;
      }

      // Set du niveau de la formation depuis le catalogue
      if (formation && effectif.formation) {
        effectif.formation.niveau = getNiveauFormationFromLibelle(formation.niveau);
        effectif.formation.niveau_libelle = formation.niveau;

        // Source: https://mission-apprentissage.slack.com/archives/C02FR2L1VB8/p1695295051135549
        // We compute the real duration of the formation in months, only if we have both date_entree and date_fin
        if (effectif.formation.date_fin && effectif.formation.date_entree) {
          effectif.formation.duree_formation_relle = Math.round(
            (effectif.formation.date_fin.getTime() - effectif.formation.date_entree.getTime()) /
              1000 /
              60 /
              60 /
              24 /
              30
          );
        }
      }

      return {
        effectif: {
          ...effectif,
          organisme_id: organismeLieu?._id,
          organisme_formateur_id: organismeFormateur?._id,
          organisme_responsable_id: organismeResponsable?._id,
          _computed: addComputedFields({ organisme: organismeLieu, effectif }),
        },
        organisme: organismeLieu,
      };
    })
    .safeParseAsync(rawEffectifQueued);

  return {
    result,
    itemProcessingInfos,
    organismeTarget,
  };
}

async function transformEffectifQueueV1V2ToEffectif(rawEffectifQueued: IEffectifQueue): Promise<{
  result: SafeParseReturnType<IEffectifQueue, { effectif: IEffectif; organisme: IOrganisme }>;
  itemProcessingInfos: ItemProcessingInfos;
  organismeTarget: any;
}> {
  const itemProcessingInfos: ItemProcessingInfos = {};
  let organismeTarget;

  const result = await dossierApprenantSchemaV1V2()
    .transform(async (effectifQueued, ctx) => {
      const [effectif, organisme, formation] = await Promise.all([
        (async () => {
          return await transformEffectifQueueToEffectif(effectifQueued);
        })(),
        (async () => {
          const { organisme, stats } = await findOrganismeWithStats(
            effectifQueued.uai_etablissement,
            effectifQueued.siret_etablissement
          );
          organismeTarget = organisme;
          Object.assign(itemProcessingInfos, addPrefixToProperties("organisme_", stats));
          return organisme;
        })(),
        (async () => {
          const formationFromCatalogue = await formationsCatalogueDb().findOne({ cfd: effectifQueued.id_formation });
          itemProcessingInfos.formation_cfd = effectifQueued.id_formation;
          itemProcessingInfos.formation_found = !!formationFromCatalogue;
          return formationFromCatalogue;
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

      // Set du niveau de la formation depuis le catalogue
      if (formation && effectif.formation) {
        effectif.formation.niveau = getNiveauFormationFromLibelle(formation.niveau);
        effectif.formation.niveau_libelle = formation.niveau;
      }
      return {
        effectif: {
          ...effectif,
          organisme_id: organisme?._id,
          _computed: addComputedFields({ organisme, effectif }),
        },
        organisme: organisme,
      };
    })
    .safeParseAsync(rawEffectifQueued);
  return {
    result,
    itemProcessingInfos,
    organismeTarget,
  };
}

async function transformEffectifQueueToEffectif(
  effectifQueue: DossierApprenantSchemaV1V2ZodType | DossierApprenantSchemaV3ZodType
): Promise<IEffectif> {
  return await completeEffectifAddress(
    mergeEffectifWithDefaults(
      mapEffectifQueueToEffectif(effectifQueue as any) as any,
      effectifQueue.source !== SOURCE_APPRENANT.FICHIER
    )
  );
}

/**
 * Le but de cette fonction est de fusionner un effectif en base de données avec des nouvelles données.
 * Le besoin est né suite à un problème qui faisait que les ajouts de données SIFA directement dans la plateforme
 * étaient effacées chaque jour. Cela ne résout pas le problème des modifications de données qui seront écrasées,
 * ce qui est un autre sujet métier plus complexe ("qu'est-ce qui fait autorité ? le dernier ? autre chose ?").
 * Fonctionnement :
 *  - Le statut d'historique est construit grâce à une fonction dédiée.
 *  - On préfèrera toujours les valeurs non vides (null, undefined ou "") quelles que soient leur provenance.
 *  - On préfèrera toujours les tableaux de newObject aux tablea  ux de previousObject (pas de fusion de tableau)
 */
export function mergeEffectif(effectifDb: IEffectif, effectif: IEffectif): IEffectif {
  return {
    ...mergeIgnoringNullPreferringNewArray(effectifDb, effectif),
    apprenant: {
      ...mergeIgnoringNullPreferringNewArray(effectifDb.apprenant, effectif.apprenant),
      // Update de l'historique de statut à la main
      historique_statut: buildNewHistoriqueStatutApprenant(
        effectifDb.apprenant.historique_statut,
        effectif.apprenant?.historique_statut[0]?.valeur_statut,
        effectif.apprenant?.historique_statut[0]?.date_statut
      ),
    },
    updated_at: new Date(),
    created_at: effectifDb.created_at, // Preserve the original created_at date
  };
}

/**
 * Fonction de création ou de MAJ de l'effectif depuis la queue
 */
const createOrUpdateEffectif = async (
  effectif: IEffectif,
  retryCount = 0
): Promise<{ effectifId: ObjectId; itemProcessingInfos: ItemProcessingInfos }> => {
  const effectifWithComputedFields = {
    ...effectif,
    _computed: {
      ...effectif._computed,
    },
  };
  const itemProcessingInfos: ItemProcessingInfos = {};
  let effectifDb = await checkIfEffectifExists(effectifWithComputedFields);
  itemProcessingInfos.effectif_new = !effectifDb;

  try {
    // Gestion des MAJ d'effectif
    if (effectifDb) {
      const mergedEffectif = mergeEffectif(effectifDb, effectifWithComputedFields);
      // L'effectif est fusionné avec les nouvelles données.
      // Si une donnée a été modifiée manuellement dans la plateforme, elle sera écrasée par l'import.
      // Ce (potentiel, tout dépend de ce qu'on veut) problème doit être traité d'un point de vue métier.
      await effectifsDb().findOneAndUpdate(
        { _id: effectifDb._id },
        {
          $set: mergedEffectif,
        }
      );
    } else {
      effectifDb = { ...effectifWithComputedFields, _id: new ObjectId() };
      await effectifsDb().insertOne(effectifDb);
    }

    itemProcessingInfos.effectif_id = effectifDb._id.toString();

    // Lock de tous les champs (non vide) mis à jour par l'API pour ne pas permettre la modification côté UI
    // Uniquement dans le cas où c'est bien par API et non par import manuel (a.k.a téléversement)
    if (effectif.source !== SOURCE_APPRENANT.FICHIER) {
      await lockEffectif(effectifDb);
    }

    return { effectifId: effectifDb._id, itemProcessingInfos };
  } catch (err) {
    // Le code d'erreur 11000 correspond à une duplication d'index unique
    // Ce cas arrive lors du traitement concurrentiel du meme effectif dans la queue
    if (typeof err === "object" && err !== null && "code" in err && err.code === 11000) {
      // On ré-essaie une fois maximum
      if (retryCount === 0) return createOrUpdateEffectif(effectif, retryCount + 1);
    }

    throw err;
  }
};

async function findOrganismeWithStats(
  uai_etablissement: string,
  siret_etablissement?: string,
  projection = {}
): Promise<{ organisme: IOrganisme | null; stats: OrganismeSearchStatsInfos }> {
  const stats: OrganismeSearchStatsInfos = {};

  // 1. On essaie de corriger l'UAI et le SIRET avec la collection fiabilisationUaiSiret
  const fiabilisationResult = await fiabilisationUaiSiretDb().findOne({
    uai: uai_etablissement,
    siret: siret_etablissement,
  });
  let uai: string;
  let siret: string;
  if (fiabilisationResult?.type === "A_FIABILISER") {
    uai = fiabilisationResult.uai_fiable as string;
    siret = fiabilisationResult.siret_fiable as string;
  } else {
    uai = uai_etablissement;
    siret = siret_etablissement as string;
  }

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

const handleDECAMechanism = async (organismeTarget) => {
  if (!organismeTarget) {
    logger.error("Cannot find target organisme for this transmission");
    return;
  }
  const orga_id = organismeTarget._id;
  const orga = await organismesDb().findOne({ _id: orga_id });
  return updateOrganismesHasTransmittedWithHierarchy(orga, true);
};
