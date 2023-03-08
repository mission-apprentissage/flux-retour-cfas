import { collectionExistInDb } from "../src/common/mongodb.js";

export const up = async (db) => {
  // Suppression des collections inutilisées (si elles existent)

  const collectionsInDb = await db.listCollections().toArray();

  const collectionsToRemove = [
    "effectifsApprenants",
    "referentielSiret",
    "duplicatesEvents",
    "cfas",
    "archiveDossiersApprenants",
    "dossiersApprenants",
  ];

  for (const currentCollectionToRemove of collectionsToRemove) {
    if (collectionExistInDb(collectionsInDb, currentCollectionToRemove))
      await db.collection(currentCollectionToRemove).drop();
  }
};
