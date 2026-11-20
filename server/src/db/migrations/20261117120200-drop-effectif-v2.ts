import { Db } from "mongodb";

export const up = async (db: Db) => {
  const [collection] = await db.listCollections({ name: "effectifV2" }, { nameOnly: true }).toArray();
  if (collection) {
    await db.collection("effectifV2").drop();
  }
};
