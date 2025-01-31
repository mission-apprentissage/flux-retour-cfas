import { effectifsDECADb } from "@/common/model/collections";

export const up = async () => {
  try {
    const cursor = effectifsDECADb().find({ transmitted_at: { $exists: false } });

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

    console.info(`Migration completed successfully: Updated transmitted_at for ${totalUpdated} effectifs.`);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`[ERROR] Migration failed.`, {
        message: error.message,
        stack: error.stack,
      });
    } else {
      console.error(`[ERROR] Migration failed.`, {
        message: String(error),
      });
    }
  }
};
