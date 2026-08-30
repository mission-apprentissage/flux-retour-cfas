import { Db } from "mongodb";

const DEAD_INDEXES = [
  "nir_apprenant_1",
  "id_erp_apprenant",
  "processed_at_1_created_at_1",
  "siret_etablissement",
  "uai_etablissement",
  "annee_scolaire",
  "source",
];

export const up = async (db: Db) => {
  const collection = db.collection("effectifsQueue");
  for (const name of DEAD_INDEXES) {
    try {
      await collection.dropIndex(name);
    } catch (e: any) {
      if (e.codeName !== "IndexNotFound" && e.code !== 27) throw e;
    }
  }
};
