import logger from "@/common/logger";
import { effectifsDECADb } from "@/common/model/collections";

export const up = async () => {
  try {
    const cursor = effectifsDECADb().find({});

    const CHUNK_SIZE = 1000;
    let bulkUpdates: Array<{ updateOne: { filter: { _id: any }; update: { $set: { transmitted_at: any } } } }> = [];
    let totalUpdated = 0;

    for await (const { _id, updated_at } of cursor) {
      bulkUpdates.push({
        updateOne: {
          filter: { _id },
          update: { $set: { transmitted_at: updated_at } },
        },
      });

      if (bulkUpdates.length >= CHUNK_SIZE) {
        await effectifsDECADb().bulkWrite(bulkUpdates);
        totalUpdated += bulkUpdates.length;
        bulkUpdates = [];
      }
    }

    if (bulkUpdates.length > 0) {
      await effectifsDECADb().bulkWrite(bulkUpdates);
      totalUpdated += bulkUpdates.length;
    }

    logger.info({ totalUpdated }, "[Migration] transmitted_at mis à jour");
  } catch (error) {
    logger.error({ err: error }, "[Migration] Échec de la migration");
  }
};
