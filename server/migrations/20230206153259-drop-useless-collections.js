export const up = async (db) => {
  // Suppression des collections inutilisées
  await db.collection("effectifsApprenants").drop();
  await db.collection("referentielSiret").drop();
  await db.collection("duplicatesEvents").drop();
  await db.collection("cfas").drop();
  await db.collection("archiveDossiersApprenants").drop();
  await db.collection("dossiersApprenants").drop();
};

export const down = async () => {};
