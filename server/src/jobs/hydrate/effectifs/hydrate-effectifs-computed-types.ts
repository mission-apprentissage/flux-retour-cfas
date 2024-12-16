import { captureException } from "@sentry/node";
import { IEffectif } from "shared/models";
import { substractDaysUTC } from "shared/utils";

import { updateEffectifStatut } from "@/common/actions/effectifs.statut.actions";
import logger from "@/common/logger";
import { effectifsDb } from "@/common/model/collections";

/**
 * Met à jour le statut des effectifs en fonction d'une requête donnée.
 *
 * @param {Object} params - Paramètres de la fonction, incluant :
 *                          query (Requête MongoDB pour filtrer les effectifs) et
 *                          evaluationDate (La date pour évaluer le statut des effectifs).
 */
export async function hydrateEffectifsComputedTypes(
  { query = {}, evaluationDate = new Date() } = {},
  signal: AbortSignal
) {
  let nbEffectifsMisAJour = 0;
  let nbEffectifsNonMisAJour = 0;

  const BULK_SIZE = 100;
  let bulkEffectifs: IEffectif[] = [];

  const computedQuery = {
    ...query,
    updated_at: { $lt: substractDaysUTC(evaluationDate, 7) },
  };

  const processEffectif = async (eff: IEffectif) => {
    if (eff) {
      const isSuccess = await updateEffectifStatut(eff, evaluationDate);
      if (isSuccess) {
        nbEffectifsMisAJour++;
      } else {
        nbEffectifsNonMisAJour++;
      }
    }
  };

  try {
    const cursor = effectifsDb().find(computedQuery);

    while (await cursor.hasNext()) {
      const effectif: IEffectif | null = await cursor.next();
      if (effectif) {
        bulkEffectifs.push(effectif);
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
}
