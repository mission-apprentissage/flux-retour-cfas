export const up = async (db) => {
  await db.collection("statutsCandidats").rename("dossiersApprenants");
};

export const down = async (db) => {
  await db.collection("dossiersApprenants").rename("statutsCandidats");
};
