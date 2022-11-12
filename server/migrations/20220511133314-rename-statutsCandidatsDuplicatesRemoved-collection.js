export const up = async (db) => {
  if (db.collections.statutsCandidatsDuplicatesRemoved) {
    await db.collection("statutsCandidatsDuplicatesRemoved").rename("dossiersApprenantsDuplicatesRemoved");
  }
};

export const down = async (db) => {
  if (db.collections.dossiersApprenantsDuplicatesRemoved) {
    await db.collection("dossiersApprenantsDuplicatesRemoved").rename("statutsCandidatsDuplicatesRemoved");
  }
};
