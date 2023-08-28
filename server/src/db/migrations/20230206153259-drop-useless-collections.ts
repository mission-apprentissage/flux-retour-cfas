import { Db, MongoClient } from "mongodb";

export const up = async (db: Db, _client: MongoClient) => {
  // Suppression des collections inutilisées (si elles existent)
  const collectionsInDb = (await db.listCollections().toArray()).map(({ name }) => name);

  const collectionsToRemove = [
    "effectifsApprenants",
    "referentielSiret",
    "duplicatesEvents",
    "cfas",
    "archiveDossiersApprenants",
    "dossiersApprenants",
  ];

  for (const currentCollectionToRemove of collectionsToRemove) {
    if (collectionsInDb.includes(currentCollectionToRemove)) {
      console.info(`Suppression de la collection ${currentCollectionToRemove}`);
      await db.collection(currentCollectionToRemove).drop();
    }
  }
};

export const down = async () => {};
