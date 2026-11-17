import { Db, MongoServerError } from "mongodb";

import logger from "@/common/logger";

const PURGE_INDEX = { source_organisme_id: 1, organisme_id: 1, computed_day: 1 } as const;

const dropIndexIfExists = async (db: Db, name: string) => {
  try {
    await db.collection("effectifsQueue").dropIndex(name);
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 27) {
      return;
    }
    throw error;
  }
};

export const up = async (db: Db) => {
  const queue = db.collection("effectifsQueue");
  await queue.createIndex(PURGE_INDEX);
  await dropIndexIfExists(db, "source_organisme_id");

  const indexes = await queue.listIndexes().toArray();
  if (indexes.some(({ name }) => name === "processed_at_1_created_at_1")) {
    await dropIndexIfExists(db, "processed_at");
  } else {
    logger.warn("Index processed_at gardé : processed_at_1_created_at_1 est absent d'effectifsQueue");
  }
};
