export const up = async (db) => {
  db.collection("statutsCandidats").updateMany({ erps: null }, { $set: { erps: [] } });
  db.collection("statutsCandidats").updateMany(
    { etablissement_reseaux: null },
    { $set: { etablissement_reseaux: [] } }
  );
};

export const down = async (db) => {
  db.collection("statutsCandidats").updateMany({ erps: [] }, { $set: { erps: null } });
  db.collection("statutsCandidats").updateMany(
    { etablissement_reseaux: [] },
    { $set: { etablissement_reseaux: null } }
  );
};
