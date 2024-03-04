import { Db } from "mongodb";

export const up = async (db: Db) => {
  await db.dropCollection("jobEvents").catch((err) => {
    // code 26 = collection does not exist
    if (err.code !== 26) {
      throw err;
    }
  });
};
