import { Db } from "mongodb";

export const up = async (db: Db) => {
  const collection = db.collection("organismes");
  await collection.updateMany({}, { $unset: { metiers: "" } });
};
