import { Db, MongoServerError } from "mongodb";

const QUEUE_INDEXES = ["id_erp_apprenant", "annee_scolaire", "uai_etablissement", "siret_etablissement"];
const V2_COLLECTIONS = ["organismeV2", "transmissionV2"];

const hasCode = (error: unknown, ...codes: number[]) =>
  error instanceof MongoServerError && codes.includes(error.code as number);

export const up = async (db: Db) => {
  await db
    .collection("jwtSessions")
    .updateMany({ created_at: { $exists: false } }, [{ $set: { created_at: { $toDate: "$_id" } } }]);

  for (const name of V2_COLLECTIONS) {
    try {
      await db.collection(name).drop();
    } catch (error) {
      if (!hasCode(error, 26)) throw error;
    }
  }

  for (const name of QUEUE_INDEXES) {
    try {
      await db.collection("effectifsQueue").dropIndex(name);
    } catch (error) {
      if (!hasCode(error, 26, 27)) throw error;
    }
  }
};
