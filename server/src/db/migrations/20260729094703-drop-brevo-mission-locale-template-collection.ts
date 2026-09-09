import { Db } from "mongodb";

export const up = async (db: Db) => {
  const collections = await db.listCollections({ name: "brevoMissionLocaleTemplate" }).toArray();
  if (collections.length > 0) {
    await db.collection("brevoMissionLocaleTemplate").drop();
  }
};
