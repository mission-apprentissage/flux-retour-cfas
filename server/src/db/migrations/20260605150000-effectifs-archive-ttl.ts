import { Db } from "mongodb";

const TTL_SECONDS = 60 * 60 * 24 * 30 * 24; // 720 jours

export const up = async (db: Db) => {
  await db
    .collection("effectifsArchive")
    .createIndex({ "suppression.date": 1 }, { expireAfterSeconds: TTL_SECONDS, name: "ttl_suppression_date" });
};
