import { Db } from "mongodb";

export const up = async (db: Db) => {
  await db.collection("uploads").drop();
};
