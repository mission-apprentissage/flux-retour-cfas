const { runScript } = require("../scriptWrapper");
const axios = require("axios");

const normalizeCodeTerritoire = (code) => {
  const n = Number(code);

  if (n < 10) return `0${n}`;
  return n.toString();
};

/**
 * Ce script permet de créer un export contenant les CFAS sans SIRET
 */
runScript(async ({ db }) => {
  await detectLocationDifferences({ db });
}, "retrieve-location-from-uai");

const detectLocationDifferences = async ({ db }) => {
  const { data } = await axios.get("https://geo.api.gouv.fr/departements");
  const departementsRegionMap = data.reduce((acc, cur) => {
    return { ...acc, [cur.code]: cur.codeRegion };
  }, {});

  const cursor = db.collection("statutsCandidats").find({
    uai_etablissement_valid: true,
  });

  while (await cursor.hasNext()) {
    const document = await cursor.next();
    const departementFromUai = normalizeCodeTerritoire(document.uai_etablissement.slice(0, 3));
    const regionFromUai = normalizeCodeTerritoire(departementsRegionMap[departementFromUai]);

    await db.collection("statutsCandidats").findOneAndUpdate(
      { _id: document._id },
      {
        $set: { etablissement_num_departement: departementFromUai, etablissement_num_region: regionFromUai },
        $unset: {
          etablissement_adresse: "",
          etablissement_code_postal: "",
          etablissement_localite: "",
          etablissement_geo_coordonnees: "",
          etablissement_nom_region: "",
          etablissement_nom_departement: "",
          etablissement_nom_academie: "",
          etablissement_num_academie: "",
        },
      }
    );
  }
};
