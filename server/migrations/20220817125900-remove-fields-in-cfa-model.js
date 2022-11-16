export const up = async (db) => {
  const collection = db.collection("cfas");
  await collection.updateMany(
    {},
    {
      $unset: {
        siret_formateur: "",
        siret_responsable: "",
      },
    }
  );
};

export const down = async () => {};
