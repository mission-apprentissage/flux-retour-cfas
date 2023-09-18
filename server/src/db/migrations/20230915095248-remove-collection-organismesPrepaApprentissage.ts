import { Db, MongoClient } from "mongodb";

export const up = async (db: Db, _client: MongoClient) => {
  // Suppression de la collection organismesPrepaApprentissage si elle existe
  const collectionsInDb = (await db.listCollections().toArray()).map(({ name }) => name);

  if (collectionsInDb.includes("organismesPrepaApprentissage")) {
    console.info(`Suppression de la collection organismesPrepaApprentissage`);
    await db.collection("organismesPrepaApprentissage").drop();
  }
};
