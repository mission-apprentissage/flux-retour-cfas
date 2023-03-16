export const up = async (db) => {
  const collection = db.collection("dossiersApprenants");
  await collection.updateMany(
    { siret_etablissement: "" },
    {
      $set: {
        siret_etablissement: null,
      },
    }
  );
};
