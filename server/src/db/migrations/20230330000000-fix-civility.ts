import { Db, MongoClient } from "mongodb";

export const up = async (db: Db, _client: MongoClient) => {
  // cette migration corrige le champ civility pour les utilisateurs créés en dehors de l'inscription
  await db.collection("usersMigration").updateMany(
    {
      civility: {
        $exists: false,
      },
    },
    {
      $set: {
        civility: "Monsieur",
      },
    },
    { bypassDocumentValidation: true }
  );
};
