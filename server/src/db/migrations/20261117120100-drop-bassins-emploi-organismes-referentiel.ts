import { Db } from "mongodb";

const COLLECTIONS = ["bassinsEmploi", "organismesReferentiel"];

export const up = async (db: Db) => {
  const existing = new Set((await db.listCollections({}, { nameOnly: true }).toArray()).map(({ name }) => name));

  for (const name of COLLECTIONS) {
    if (existing.has(name)) {
      await db.collection(name).drop();
    }
  }
};
