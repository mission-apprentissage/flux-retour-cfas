import { Db, MongoClient } from "mongodb";

export const up = async (db: Db, _client: MongoClient) => {
  // migration du champ apprenant.handicap vers apprenant.rqth
  await db
    .collection("effectifs")
    .updateMany(
      { "apprenant.handicap": true },
      { $set: { "apprenant.rqth": true } },
      { bypassDocumentValidation: true }
    );
  await db
    .collection("effectifs")
    .updateMany({}, { $unset: { "apprenant.handicap": "" } }, { bypassDocumentValidation: true });

  // migration du champ apprenant.contrats vers contrats
  await db
    .collection("effectifs")
    .updateMany({}, { $rename: { "apprenant.contrats": "contrats" } }, { bypassDocumentValidation: true });
};
