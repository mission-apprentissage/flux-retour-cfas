const assert = require("assert");
const { format } = require("date-fns");

const { createRandomDossierApprenantApiInput } = require("../../../data/randomizedSample");
const {
  getJwtForUser,
  getHttpClient,
  postDossiersApprenantsTest,
  postDossiersApprenants,
} = require("../../../utils/api");

/**
 * Ce script permet d'envoyer des dossiers apprenants de tests toutes les nuits
 * à la plateforme de recette.
 */
async function main() {
  console.info("Run send-dossiers-apprenants Job");

  assert(process.env.API_URL, "API_URL is required");
  assert(process.env.API_USERNAME, "API_USERNAME is required");
  assert(process.env.API_PASSWORD, "API_PASSWORD is required");

  const httpClient = getHttpClient(process.env.API_URL);
  const token = await getJwtForUser({
    httpClient,
    username: process.env.API_USERNAME,
    password: process.env.API_PASSWORD,
  });

  const testResponse = await postDossiersApprenantsTest({ httpClient, token });
  if (testResponse.data?.msg !== "ok") {
    console.error(JSON.stringify(testResponse, null, 2));
    throw new Error("Error while testing dossiers apprenants connection");
  }
  // we send 100 dossiers apprenants,
  // 1 with all fields for "Donald Duck", and 99 with random data
  const dossiersApprenants = [
    {
      // required fields
      nom_apprenant: "Duck",
      prenom_apprenant: "Donald",
      date_de_naissance_apprenant: format(new Date(), "yyyy-MM-dd"),
      uai_etablissement: "0142321X",
      nom_etablissement: "LE MANS Entreprise",
      statut_apprenant: 2,
      id_formation: "32031213",
      annee_scolaire: "2021-2022",
      date_metier_mise_a_jour_statut: new Date().toISOString(),
      id_erp_apprenant: "1121321321231",
      // optional fields
      ine_apprenant: "061322157SS",
      email_contact: "test@mail.com",
      tel_apprenant: "0169044455",
      code_commune_insee_apprenant: "91700",
      siret_etablissement: "",
      etablissement_formateur_geo_coordonnees: "49.413655,1.073591",
      etablissement_formateur_code_commune_insee: "54357",
      libelle_court_formation: "BTS Management Commercial Opérationnel",
      libelle_long_formation: "BTS Management Commercial Opérationnel",
      formation_rncp: "RNCP12345",
      periode_formation: "2020-2022",
      annee_formation: 1,
      contrat_date_debut: "2020-01-30T00:00:00.000Z",
      contrat_date_fin: "2020-12-30T00:00:00.000Z",
      contrat_date_rupture: "2020-04-30T00:00:00.000Z",
      date_entree_formation: "2020-02-30T00:00:00.000Z",
    },
    ...Array.from({ length: 99 }).map((_undefined, _idx) => createRandomDossierApprenantApiInput()),
  ];

  const response = await postDossiersApprenants({
    httpClient,
    token,
    data: dossiersApprenants,
  });
  console.info(JSON.stringify(response, null, 2));

  if (response.data?.status !== "OK") {
    throw new Error("Error while sending dossiers apprenants");
  }
}

main();
