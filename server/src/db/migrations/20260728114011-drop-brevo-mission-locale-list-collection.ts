import { Db } from "mongodb";

export const up = async (db: Db) => {
  const collections = await db.listCollections({ name: "brevoMissionLocaleList" }).toArray();
  if (collections.length > 0) {
    await db.collection("brevoMissionLocaleList").drop();
  }
};
