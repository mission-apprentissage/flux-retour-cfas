import { captureException } from "@sentry/node";
import { ObjectId } from "bson";
import { IEffectif, IMissionLocaleEffectif } from "shared/models";
import { IEffectifDECA } from "shared/models/data/effectifsDECA.model";
import { getAnneesScolaireListFromDate } from "shared/utils";

import { getEffectifByIdWithCollection } from "@/common/actions/effectifs.actions";
import { updateEffectifStatut } from "@/common/actions/effectifs.statut.actions";
import logger from "@/common/logger";
import { effectifsDb, effectifsDECADb, missionLocaleEffectifsDb } from "@/common/model/collections";

export type IEffectifGenerique = IEffectif | IEffectifDECA;

export type IHydrateEffectifsComputedTypesResult = {
  aborted: boolean;
  error: unknown | null;
  nbEffectifsMisAJour: number;
  nbEffectifsNonMisAJour: number;
};

export const hydrateEffectifsComputedTypesGenerique = async (
  options?,
  signal?
): Promise<IHydrateEffectifsComputedTypesResult> => {
  const effectifsResult = await hydrateEffectifsComputedTypes(options, effectifsDb, signal);
  if (effectifsResult.aborted) {
    return effectifsResult;
  }

  const decaResult = await hydrateEffectifsComputedTypes(options, effectifsDECADb, signal);

  return {
    aborted: decaResult.aborted,
    error: effectifsResult.error ?? decaResult.error,
    nbEffectifsMisAJour: effectifsResult.nbEffectifsMisAJour + decaResult.nbEffectifsMisAJour,
    nbEffectifsNonMisAJour: effectifsResult.nbEffectifsNonMisAJour + decaResult.nbEffectifsNonMisAJour,
  };
};
/**
 * Met à jour le statut des effectifs en fonction d'une requête donnée.
 *
 * @param {Object} params - Paramètres de la fonction, incluant :
 *                          query (Requête MongoDB pour filtrer les effectifs) et
 *                          evaluationDate (La date pour évaluer le statut des effectifs).
 */
export async function hydrateEffectifsComputedTypes(
  { query = {}, evaluationDate = new Date(), touchUpdatedAt = true } = {},
  collection: typeof effectifsDb | typeof effectifsDECADb,
  signal?: AbortSignal
): Promise<IHydrateEffectifsComputedTypesResult> {
  let nbEffectifsMisAJour = 0;
  let nbEffectifsNonMisAJour = 0;

  const BULK_SIZE = 100;
  let bulkEffectifs: Array<IEffectifGenerique> = [];

  const processEffectif = async (eff: IEffectifGenerique) => {
    if (eff) {
      const isSuccess = await updateEffectifStatut(eff, evaluationDate, collection(), { touchUpdatedAt });
      if (isSuccess) {
        nbEffectifsMisAJour++;
      } else {
        nbEffectifsNonMisAJour++;
      }
    }
  };

  try {
    const cursor = collection().find(query);

    while (await cursor.hasNext()) {
      const effectif: IEffectifGenerique | null = await cursor.next();
      if (effectif) {
        bulkEffectifs.push(effectif);
      }

      if (bulkEffectifs.length > BULK_SIZE) {
        await Promise.allSettled(bulkEffectifs.map(processEffectif));
        if (signal && signal.aborted) {
          return { aborted: true, error: null, nbEffectifsMisAJour, nbEffectifsNonMisAJour };
        }
        bulkEffectifs = [];
      }
    }

    if (bulkEffectifs.length > 0) {
      await Promise.allSettled(bulkEffectifs.map(processEffectif));
    }

    logger.info(`${nbEffectifsMisAJour} effectifs mis à jour, ${nbEffectifsNonMisAJour} effectifs non mis à jour.`);
    return { aborted: false, error: null, nbEffectifsMisAJour, nbEffectifsNonMisAJour };
  } catch (err) {
    logger.error(`Échec de la mise à jour des effectifs: ${err}`);
    captureException(err);
    return { aborted: false, error: err, nbEffectifsMisAJour, nbEffectifsNonMisAJour };
  }
}

/**
 * Mise a jour des effectifs des années précédentes pour tenir compte des données des missions locales
 * @param evaluationDate - Date d'évaluation
 * @param signal - Signal d'annulation
 * @returns
 */
export const hydratePreviousYearMissionLocaleEffectifStatut = async (
  evaluationDate = new Date(),
  signal?: AbortSignal
) => {
  let nbEffectifsMisAJour = 0;
  let nbEffectifsNonMisAJour = 0;

  const BULK_SIZE = 100;
  let bulkEffectifs: Array<IMissionLocaleEffectif> = [];

  const processEffectif = async (mlEff: IMissionLocaleEffectif) => {
    if (mlEff) {
      const effectif = await getEffectifByIdWithCollection(new ObjectId(mlEff.effectif_id));
      if (!effectif) {
        nbEffectifsNonMisAJour++;
        return;
      }
      const isSuccess = await updateEffectifStatut(effectif.effectif, evaluationDate, effectif.collection());
      if (isSuccess) {
        nbEffectifsMisAJour++;
      } else {
        nbEffectifsNonMisAJour++;
      }
    }
  };

  try {
    const cursor = missionLocaleEffectifsDb().find({
      "effectif_snapshot.annee_scolaire": { $nin: getAnneesScolaireListFromDate(evaluationDate) },
    });

    while (await cursor.hasNext()) {
      const mlEff: IMissionLocaleEffectif | null = await cursor.next();
      if (mlEff) {
        bulkEffectifs.push(mlEff);
      }

      if (bulkEffectifs.length > BULK_SIZE) {
        await Promise.allSettled(bulkEffectifs.map(processEffectif));
        if (signal && signal.aborted) {
          return;
        }
        bulkEffectifs = [];
      }
    }

    if (bulkEffectifs.length > 0) {
      await Promise.allSettled(bulkEffectifs.map(processEffectif));
    }

    logger.info(`${nbEffectifsMisAJour} effectifs mis à jour, ${nbEffectifsNonMisAJour} effectifs non mis à jour.`);
  } catch (err) {
    logger.error(`Échec de la mise à jour des effectifs: ${err}`);
    captureException(err);
  }
};
