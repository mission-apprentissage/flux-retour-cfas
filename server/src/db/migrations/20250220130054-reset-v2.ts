import { Db } from "mongodb";

export const up = async (db: Db) => {
  for (const name of ["organismeV2", "formationV2", "effectifV2", "transmissionV2", "personV2"]) {
    await db.collection(name).deleteMany({});
  }
};
