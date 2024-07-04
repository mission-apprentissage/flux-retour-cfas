import { captureException } from "@sentry/node";
import { SOURCE_APPRENANT, SourceApprenant } from "shared/constants";

import logger from "@/common/logger";
import { effectifsQueueDb } from "@/common/model/collections";

export async function hydrateEffectifsQueueSource() {
  let nbEffectifsMisAJour = 0;
  let nbEffectifsNonMisAJour = 0;

  try {
    const cursor = effectifsQueueDb().find({});

    while (await cursor.hasNext()) {
      const effectifQueue = await cursor.next();

      if (effectifQueue) {
        let newSource: SourceApprenant;
        if (effectifQueue.source === "televersement") {
          newSource = SOURCE_APPRENANT.FICHIER;
        } else {
          newSource = SOURCE_APPRENANT.ERP;
        }

        const updateResult = await effectifsQueueDb().updateOne(
          { _id: effectifQueue._id },
          { $set: { source: newSource } }
        );

        if (updateResult.modifiedCount > 0) {
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
