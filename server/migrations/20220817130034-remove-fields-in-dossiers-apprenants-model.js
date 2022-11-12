export const up = async (db) => {
  const collection = db.collection("dossiersApprenants");
  await collection.updateMany(
    {},
    {
      $unset: {
        match_formation_mnaCatalog_cfd_siret: "",
        etablissement_formateur_siret: "",
        etablissement_gestionnaire_siret: "",
      },
    }
  );
};

export const down = async () => {};
