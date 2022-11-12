export const up = async (db) => {
  const collection = db.collection("statutsCandidats");

  await collection.updateMany(
    {},
    { $rename: { id_formation: "formation_cfd", id_formation_valid: "formation_cfd_valid" } }
  );
};

export const down = async (db) => {
  const collection = db.collection("statutsCandidats");

  await collection.updateMany(
    {},
    { $rename: { formation_cfd: "id_formation", formation_cfd_valid: "id_formation_valid" } }
  );
};
