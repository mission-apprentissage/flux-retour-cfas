import { captureException } from "@sentry/node";
import { SOURCE_APPRENANT, SourceApprenant } from "shared/constants";

import logger from "@/common/logger";
import { effectifsDb, effectifsQueueDb } from "@/common/model/collections";

export async function hydrateEffectifsSource() {
  let nbEffectifsMisAJour = 0;
  let nbEffectifsNonMisAJour = 0;

  try {
    const cursor = effectifsDb().find({});

    while (await cursor.hasNext()) {
      const effectif = await cursor.next();

      if (effectif) {
        let newSource: SourceApprenant;
        if (effectif.source === "televersement") {
          newSource = SOURCE_APPRENANT.FICHIER;
        } else {
          newSource = SOURCE_APPRENANT.ERP;
        }

        const updateResult = await effectifsDb().updateOne({ _id: effectif._id }, { $set: { source: newSource } });

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

export const cleanEffectifsSource = async () => {
  logger.info("Mise à jour des sources des effectifs");
  const effectifsUpdated = await effectifsDb().updateMany(
    { source: { $in: ["scform", "fcamanager"] } },
    { $set: { source: SOURCE_APPRENANT.ERP } }
  );
  logger.info("Effectif mis à jour :", effectifsUpdated.modifiedCount);
  logger.info("Mise à jour des sources des effectifs queue");
  const effectifsQueueUpdated = await effectifsQueueDb().updateMany(
    { source: { $in: ["scform", "fcamanager"] } },
    { $set: { source: SOURCE_APPRENANT.ERP } }
  );
  logger.info("Effectif mis à jour :", effectifsQueueUpdated.modifiedCount);
};
