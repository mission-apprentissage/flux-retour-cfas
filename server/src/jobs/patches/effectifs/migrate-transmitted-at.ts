import { effectifsDb, effectifsQueueDb } from "@/common/model/collections";

export const tmpMigrateEffectifsTransmittedAt = async () => {
  try {
    const cursor = effectifsQueueDb().aggregate([
      {
        $group: {
          _id: "$effectif_id",
          transmitted_at: { $max: "$created_at" },
        },
      },
    ]);

    const CHUNK_SIZE = 1000;
    let bulkUpdates: Array<{ updateOne: { filter: { _id: any }; update: { $set: { transmitted_at: any } } } }> = [];
    let totalUpdated = 0;

    for await (const { _id, transmitted_at } of cursor) {
      bulkUpdates.push({
        updateOne: {
          filter: { _id },
          update: { $set: { transmitted_at } },
        },
      });

      if (bulkUpdates.length >= CHUNK_SIZE) {
        await effectifsDb().bulkWrite(bulkUpdates);
        totalUpdated += bulkUpdates.length;
        bulkUpdates = [];
      }
    }

    if (bulkUpdates.length > 0) {
      await effectifsDb().bulkWrite(bulkUpdates);
      totalUpdated += bulkUpdates.length;
    }

    console.info(`Migration completed successfully: Updated transmitted_at for ${totalUpdated} effectifs.`);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`[ERROR] tmpMigrateEffectifsTransmittedAt: Migration failed.`, {
        message: error.message,
        stack: error.stack,
      });
    } else {
      console.error(`[ERROR] tmpMigrateEffectifsTransmittedAt: Migration failed.`, {
        message: String(error),
      });
    }
  }
};
