import { ObjectId } from "mongodb";
import { IOrganisme } from "shared/models";

import { generateOrganismeComputed } from "@/common/actions/organismes/organismes.actions";
import logger from "@/common/logger";
import { organismesDb, effectifsDb } from "@/common/model/collections";

export async function hydrateEffectifsComputedOrganisme() {
  const batchSize = 100;
  let processedCount = 0;

  const cursor = organismesDb().find({});
  while (await cursor.hasNext()) {
    const batch: IOrganisme[] = [];
    for (let i = 0; i < batchSize; i++) {
      if (await cursor.hasNext()) {
        const organisme = await cursor.next();
        if (organisme) {
          batch.push(organisme);
        }
      } else {
        break;
      }
    }

    await Promise.all(
      batch.map(async (organisme) => {
        const computedResult = generateOrganismeComputed(organisme);
        await effectifsDb().updateMany(
          { organisme_id: new ObjectId(organisme._id) },
          {
            $set: {
              "_computed.organisme": computedResult,
            },
          }
        );
      })
    );

    processedCount += batch.length;
    logger.info(`${processedCount} organismes traités jusqu'à présent.`);
  }

  logger.info(`Traitement de ${processedCount} organismes terminé.`);
}
