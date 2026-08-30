import { Db } from "mongodb";

export const up = async (db: Db) => {
  const dropIfExists = async (name: string) => {
    try {
      await db.collection(name).drop();
    } catch (e: any) {
      if (e.codeName !== "NamespaceNotFound" && e.code !== 26) throw e;
    }
  };

  for (const name of ["effectifsSnapshot", "formations", "users", "testPaulo"]) {
    await dropIfExists(name);
  }

  await db.collection("auditLogs").deleteMany({
    action: { $regex: "^mergeOrganismeSansUaiDansOrganismeFiable" },
  });
};
