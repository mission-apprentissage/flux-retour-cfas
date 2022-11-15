export const up = async (db) => {
  db.collection("dossiersApprenants").updateMany(
    {},
    {
      $unset: {
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

export const down = async () => {};
