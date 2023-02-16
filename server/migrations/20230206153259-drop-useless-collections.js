export const up = async (db) => {
  // Suppression des collections inutilisées (si elles existent)
  const collectionsInDb = await db.listCollections().toArray();

  if (existInDb(collectionsInDb, "effectifsApprenants")) await db.collection("effectifsApprenants").drop();
  if (existInDb(collectionsInDb, "referentielSiret")) await db.collection("referentielSiret").drop();
  if (existInDb(collectionsInDb, "duplicatesEvents")) await db.collection("duplicatesEvents").drop();
  if (existInDb(collectionsInDb, "cfas")) await db.collection("cfas").drop();
  if (existInDb(collectionsInDb, "archiveDossiersApprenants")) await db.collection("archiveDossiersApprenants").drop();
  if (existInDb(collectionsInDb, "dossiersApprenants")) await db.collection("dossiersApprenants").drop();
};

const existInDb = (collectionsInDb, collectionName) => collectionsInDb.map(({ name }) => name).includes(collectionName);

export const down = async () => {};
