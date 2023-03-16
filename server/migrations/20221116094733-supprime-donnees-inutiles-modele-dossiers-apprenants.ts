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
        etablissement_formateur_code_postal: "",
        etablissement_geo_coordonnees: "",
        etablissement_formateur_uai: "",
        etablissement_gestionnaire_uai: "",
        etablissement_num_academie: "",
        etablissement_nom_academie: "",
        etablissement_localite: "",
        etablissement_formateur_ville: "",
        siret_catalogue: "",
      },
    }
  );
};
