import { Db } from "mongodb";

import { effectifsDb } from "@/common/model/collections";

export const up = async (db: Db) => {
  await db.collection("formation").deleteMany({});

  await effectifsDb().updateMany(
    { "formation.formation_id": { $exists: true } },
    { $unset: { "formation.formation_id": "" } },
    { bypassDocumentValidation: true }
  );
};
