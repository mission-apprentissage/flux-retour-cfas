import { Db, MongoServerError } from "mongodb";

export const up = async (db: Db) => {
  const dropIfExists = async (name: string) => {
    try {
      await db.collection(name).drop();
    } catch (e) {
      if (e instanceof MongoServerError && (e.codeName === "NamespaceNotFound" || e.code === 26)) {
        return;
      }
      throw e;
    }
  };

  for (const name of ["effectifsSnapshot", "formations", "users", "testPaulo"]) {
    await dropIfExists(name);
  }
};
