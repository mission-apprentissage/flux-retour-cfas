import { ObjectId } from "mongodb";

import logger from "@/common/logger";
import { missionLocaleEffectifsDb } from "@/common/model/collections";
import config from "@/config";

const ORGANISME_USER_MAPPING = {
  "63c7d6c23189c2d913375560": "68cc17d5438b894c373ecec5",
  "635acf045e798f12bd91a83d": "68c2e791a4c5bc80810bb2e5",
  "63b6526c52fd85349a88c296": "68cbdc0d438b894c373ecda3",
};

export const up = async () => {
  if (config.env !== "production" && config.env !== "preprod") {
    logger.info(
      "[Migration] Cette migration ne s'exécute qu'en production et preprod. Environnement actuel : " + config.env
    );
    return;
  }

  logger.info("[Migration] Début de la correction des acc_conjoint_by manquants");

  const organismeIds = Object.keys(ORGANISME_USER_MAPPING).map((id) => new ObjectId(id));

  const effectifsToFix = await missionLocaleEffectifsDb()
    .find({
      "organisme_data.acc_conjoint": true,
      "effectif_snapshot.organisme_id": { $in: organismeIds },
      $or: [{ "organisme_data.acc_conjoint_by": { $exists: false } }, { "organisme_data.acc_conjoint_by": null }],
    })
    .toArray();

  logger.info(`[Migration] ${effectifsToFix.length} effectifs à corriger trouvés`);

  if (effectifsToFix.length === 0) {
    logger.info("[Migration] Aucun effectif à corriger");
    return;
  }

  const bulkOps = effectifsToFix
    .map((effectif) => {
      const organismeId = effectif.effectif_snapshot.organisme_id.toString();
      const userId = ORGANISME_USER_MAPPING[organismeId as keyof typeof ORGANISME_USER_MAPPING];

      if (!userId) {
        logger.warn(`[Migration] Organisme non mappé trouvé : ${organismeId} pour effectif ${effectif._id}. Ignoré.`);
        return null;
      }

      return {
        updateOne: {
          filter: { _id: effectif._id },
          update: {
            $set: {
              "organisme_data.acc_conjoint_by": new ObjectId(userId),
            },
          },
        },
      };
    })
    .filter((op) => op !== null);

  const result = await missionLocaleEffectifsDb().bulkWrite(bulkOps);

  logger.info(`[Migration] ${result.modifiedCount} effectifs corrigés.`);
};
