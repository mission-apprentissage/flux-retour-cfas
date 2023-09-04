import { Db, MongoClient } from "mongodb";

export const up = async (db: Db, _client: MongoClient) => {
  await db
    .collection("organismes")
    .updateMany(
      { nom_tokenized: { $exists: true } },
      { $unset: { nom_tokenized: "" } },
      { bypassDocumentValidation: true }
    );

  await db
    .collection("formations")
    .updateMany(
      { tokenized_libelle: { $exists: true } },
      { $unset: { tokenized_libelle: "" } },
      { bypassDocumentValidation: true }
    );
};
