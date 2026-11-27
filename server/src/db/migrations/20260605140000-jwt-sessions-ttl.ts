import { Db } from "mongodb";

const TTL_SECONDS = 60 * 60 * 24 * 10;

export const up = async (db: Db) => {
  await db
    .collection("jwtSessions")
    .updateMany({ created_at: { $exists: false } }, [{ $set: { created_at: { $toDate: "$_id" } } }]);

  await db
    .collection("jwtSessions")
    .createIndex({ created_at: 1 }, { expireAfterSeconds: TTL_SECONDS, name: "ttl_created_at" });
};
