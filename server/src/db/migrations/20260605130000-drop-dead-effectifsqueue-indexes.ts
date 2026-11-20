import { Db, MongoServerError } from "mongodb";

const DEAD_INDEXES = [
  "nir_apprenant_1",
  "id_erp_apprenant",
  "siret_etablissement",
  "uai_etablissement",
  "annee_scolaire",
];

export const up = async (db: Db) => {
  const collection = db.collection("effectifsQueue");
  for (const name of DEAD_INDEXES) {
    try {
      await collection.dropIndex(name);
    } catch (e) {
      if (e instanceof MongoServerError && (e.codeName === "IndexNotFound" || e.code === 27)) {
        continue;
      }
      throw e;
    }
  }
};
