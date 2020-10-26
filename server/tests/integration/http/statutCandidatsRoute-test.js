const assert = require("assert");
const httpTests = require("../../utils/httpTests");
const users = require("../../../src/common/components/users");
const { apiStatutsSeeder } = require("../../../src/common/roles");
const { StatutCandidat } = require("../../../src/common/model");
const { statutsTest, fullSample } = require("../../data/sample");
const { createRandomStatutsCandidatsList } = require("../../data/randomizedSample");

const goodApiKey = "12345";
const badApiKey = "BADAPIKEY";

const createApiUser = async () => {
  const { createUser } = await users();

  return await createUser("userApi", "password", {
    permissions: [apiStatutsSeeder],
    apiKey: goodApiKey,
  });
};

httpTests(__filename, ({ startServer }) => {
  it("Vérifie que la route statut-candidats fonctionne avec une bonne clé d'API", async () => {
    const { httpClient } = await startServer();

    // Clear statuts in DB
    await StatutCandidat.deleteMany({});

    // Create & check api user
    const userApiCreated = await createApiUser();
    assert.deepStrictEqual(userApiCreated.username, "userApi");
    assert.deepStrictEqual(userApiCreated.permissions.length > 0, true);
    assert.deepStrictEqual(userApiCreated.apiKey, goodApiKey);

    // Call Api Route
    const response = await httpClient.post("/api/statut-candidats", statutsTest, {
      headers: {
        "x-api-key": goodApiKey,
      },
    });

    // Check Api Route data
    assert.deepStrictEqual(response.status, 200);
    assert.ok(response.data.status);
    assert.ok(response.data.message);
    assert.deepStrictEqual(response.data.status, "OK");

    // Check in DB & Check data
    const foundStatut = await StatutCandidat.findOne({ ine_apprenant: `${statutsTest[0].ine_apprenant}` });

    assert.deepStrictEqual(foundStatut.nom_apprenant, statutsTest[0].nom_apprenant);
    assert.deepStrictEqual(foundStatut.prenom_apprenant, statutsTest[0].prenom_apprenant);
    assert.deepStrictEqual(foundStatut.prenom2_apprenant, null);
    assert.deepStrictEqual(foundStatut.prenom3_apprenant, null);
    assert.deepStrictEqual(foundStatut.ne_pas_solliciter, statutsTest[0].ne_pas_solliciter);
    assert.deepStrictEqual(foundStatut.email_contact, statutsTest[0].email_contact);
    assert.deepStrictEqual(foundStatut.nom_representant_legal, statutsTest[0].nom_representant_legal);
    assert.deepStrictEqual(foundStatut.tel_representant_legal, statutsTest[0].tel_representant_legal);
    assert.deepStrictEqual(foundStatut.tel2_representant_legal, statutsTest[0].tel2_representant_legal);
    assert.deepStrictEqual(foundStatut.id_formation, statutsTest[0].id_formation);
    assert.deepStrictEqual(foundStatut.libelle_court_formation, statutsTest[0].libelle_court_formation);
    assert.deepStrictEqual(foundStatut.libelle_long_formation, statutsTest[0].libelle_long_formation);
    assert.deepStrictEqual(foundStatut.uai_etablissement, statutsTest[0].uai_etablissement);
    assert.deepStrictEqual(foundStatut.nom_etablissement, statutsTest[0].nom_etablissement);
    assert.deepStrictEqual(foundStatut.statut_apprenant, statutsTest[0].statut_apprenant);
    assert.deepStrictEqual(
      foundStatut.date_metier_mise_a_jour_statut,
      new Date(Date.parse(statutsTest[0].date_metier_mise_a_jour_statut))
    );
  });

  it("Vérifie que la route statut-candidats ne fonctionne pas avec une mauvaise clé d'API", async () => {
    const { httpClient } = await startServer();

    // Create & check api user
    const userApiCreated = await createApiUser();
    assert.deepStrictEqual(userApiCreated.username, "userApi");
    assert.deepStrictEqual(userApiCreated.permissions.length > 0, true);
    assert.deepStrictEqual(userApiCreated.apiKey, goodApiKey);

    // Call Api Route with bad API Key
    const response = await httpClient.post("/api/statut-candidats", statutsTest, {
      headers: {
        "x-api-key": badApiKey,
      },
    });

    assert.deepStrictEqual(response.status, 401);
  });

  it("Vérifie l'ajout via route statut-candidats de données complètes", async () => {
    const { httpClient } = await startServer();

    // Clear statuts in DB
    await StatutCandidat.deleteMany({});

    // Create & check api user
    const userApiCreated = await createApiUser();
    assert.deepStrictEqual(userApiCreated.username, "userApi");
    assert.deepStrictEqual(userApiCreated.permissions.length > 0, true);
    assert.deepStrictEqual(userApiCreated.apiKey, goodApiKey);

    // Call Api Route with full sample
    const response = await httpClient.post("/api/statut-candidats", fullSample, {
      headers: {
        "x-api-key": goodApiKey,
      },
    });

    // Check Api Route data
    assert.deepStrictEqual(response.status, 200);
    assert.ok(response.data.status);
    assert.ok(response.data.message);
    assert.deepStrictEqual(response.data.status, "OK");
    assert.deepStrictEqual(response.data.message, "Success");
  });

  it("Vérifie l'ajout via route statut-candidats de 100 données randomisées", async () => {
    const { httpClient } = await startServer();

    const nbItemsToTest = 100;

    // Clear statuts in DB
    await StatutCandidat.deleteMany({});

    // Create & check api user
    const userApiCreated = await createApiUser();
    assert.deepStrictEqual(userApiCreated.username, "userApi");
    assert.deepStrictEqual(userApiCreated.permissions.length > 0, true);
    assert.deepStrictEqual(userApiCreated.apiKey, goodApiKey);

    // Generate random data
    const randomDataList = createRandomStatutsCandidatsList(nbItemsToTest);

    // Call Api Route with full sample
    const response = await httpClient.post("/api/statut-candidats", randomDataList, {
      headers: {
        "x-api-key": goodApiKey,
      },
    });

    // Check Api Route data
    assert.deepStrictEqual(response.status, 200);
    assert.ok(response.data.status);
    assert.ok(response.data.message);
    assert.deepStrictEqual(response.data.status, "OK");

    // Check Nb Items added
    assert.deepStrictEqual(await StatutCandidat.countDocuments({}), nbItemsToTest);
  });

  it("Vérifie l'erreur d'ajout via route statut-candidats pour un trop grande nb de données randomisées (>100)", async () => {
    const { httpClient } = await startServer();

    const nbItemsToTest = 200;

    // Clear statuts in DB
    await StatutCandidat.deleteMany({});

    // Create & check api user
    const userApiCreated = await createApiUser();
    assert.deepStrictEqual(userApiCreated.username, "userApi");
    assert.deepStrictEqual(userApiCreated.permissions.length > 0, true);
    assert.deepStrictEqual(userApiCreated.apiKey, goodApiKey);

    // Generate random data
    const randomDataList = createRandomStatutsCandidatsList(nbItemsToTest);

    // Call Api Route with full sample
    const response = await httpClient.post("/api/statut-candidats", randomDataList, {
      headers: {
        "x-api-key": goodApiKey,
      },
    });

    // Check Api Route data & Data not added
    assert.deepStrictEqual(response.status, 413);
    assert.notDeepStrictEqual(await StatutCandidat.countDocuments({}), nbItemsToTest);
  });
});
