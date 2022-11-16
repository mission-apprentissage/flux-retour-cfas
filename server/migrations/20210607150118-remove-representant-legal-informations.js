// nom_representant_legal, tel_representant_legal and tel2_representant_legal are not useful to us

export const up = async (db) => {
  const collection = db.collection("statutsCandidats");
  await collection.updateMany(
    {},
    { $unset: { nom_representant_legal: "", tel_representant_legal: "", tel2_representant_legal: "" } }
  );
};

export const down = async () => {};
