import { captureException } from "@sentry/node";

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
export async function hydrateEffectifsComputedTypes({ query = {}, evaluationDate = new Date() } = {}) {
  let nbEffectifsMisAJour = 0;
  let nbEffectifsNonMisAJour = 0;

  try {
    const cursor = effectifsDb().find(query);

    while (await cursor.hasNext()) {
      const effectif = await cursor.next();

      if (effectif) {
        const isSuccess = await updateEffectifStatut(effectif, evaluationDate);
        if (isSuccess) {
          nbEffectifsMisAJour++;
        } else {
          nbEffectifsNonMisAJour++;
        }
      }
    }

    logger.info(`${nbEffectifsMisAJour} effectifs mis à jour, ${nbEffectifsNonMisAJour} effectifs non mis à jour.`);
  } catch (err) {
    logger.error(`Échec de la mise à jour des effectifs: ${err}`);
    captureException(err);
  }
}
