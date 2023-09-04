import { Db, MongoClient } from "mongodb";

export const up = async (db: Db, _client: MongoClient) => {
  const collection = db.collection("dossiersApprenants");
  await collection.updateMany(
    { siret_etablissement: "" },
    {
      $set: {
        siret_etablissement: null,
      },
    }
  );
};
