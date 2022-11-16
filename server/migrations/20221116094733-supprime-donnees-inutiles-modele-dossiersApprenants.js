export const up = async (db) => {
  const collection = db.collection("dossiersApprenants");
  await collection.updateMany(
    {},
    {
      $unset: {
        uai_etablissement_valid: "",
        formation_cfd_valid: "",
        forced_annee_scolaire: "",
        erps: "",
        __v: "",
        history_cleaned_date: "",
      },
    }
  );
};
