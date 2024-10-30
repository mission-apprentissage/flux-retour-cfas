import { captureException } from "@sentry/node";

import logger from "@/common/logger";
import { effectifsDb, organismesDb } from "@/common/model/collections";

export async function hydrateEffectifsLieuDeFormation() {
  let nbEffectifsMisAJour = 0;
  let nbEffectifsNonMisAJour = 0;

  const lieuFormationCache = new Map();

  try {
    const cursor = effectifsDb().find({});

    while (await cursor.hasNext()) {
      const effectif = await cursor.next();

      if (effectif) {
        let lieuFormation;

        if (lieuFormationCache.has(effectif.organisme_id)) {
          lieuFormation = lieuFormationCache.get(effectif.organisme_id);
        } else {
          const organisme = await organismesDb().findOne({ _id: effectif.organisme_id });

          if (organisme) {
            lieuFormation = {
              uai: organisme.uai,
              siret: organisme.siret,
            };
            lieuFormationCache.set(effectif.organisme_id, lieuFormation);
          }
        }
        if (lieuFormation) {
          const updateResult = await effectifsDb().updateOne(
            { _id: effectif._id },
            { $set: { lieu_de_formation: lieuFormation } }
          );

          if (updateResult.modifiedCount > 0) {
            nbEffectifsMisAJour++;
          } else {
            nbEffectifsNonMisAJour++;
          }
        } else {
          nbEffectifsNonMisAJour++;
        }
      }
    }

    logger.info(
      `${nbEffectifsMisAJour} effectifs mis à jour avec lieu_de_formation, ${nbEffectifsNonMisAJour} effectifs non mis à jour.`
    );
  } catch (err) {
    logger.error(`Échec de la mise à jour des effectifs: ${err}`);
    captureException(err);
  }
}
