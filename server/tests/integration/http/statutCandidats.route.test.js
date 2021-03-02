const assert = require("assert");
const httpTests = require("../../utils/httpTests");
const users = require("../../../src/common/components/users");
const { apiStatutsSeeder } = require("../../../src/common/roles");
const { StatutCandidat } = require("../../../src/common/model");
const { createRandomStatutsCandidatsApiInputList } = require("../../data/randomizedSample");
const { fullSample } = require("../../data/sample");
const { nockGetSiretInfo, nockGetCfdInfo } = require("../../utils/nockApis/nock-tablesCorrespondances");

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
  beforeEach(() => {
    nockGetSiretInfo();
    nockGetCfdInfo();
  });

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
    const input = createRandomStatutsCandidatsApiInputList(1);
    const response = await httpClient.post("/api/statut-candidats", input, {
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
    const foundStatut = await StatutCandidat.findOne({
      prenom_apprenant: input[0].prenom_apprenant,
      nom_apprenant: input[0].nom_apprenant,
    });

    assert.deepStrictEqual(foundStatut.nom_apprenant, input[0].nom_apprenant);
    assert.deepStrictEqual(foundStatut.prenom_apprenant, input[0].prenom_apprenant);
    assert.deepStrictEqual(foundStatut.prenom2_apprenant, input[0].prenom2_apprenant);
    assert.deepStrictEqual(foundStatut.prenom3_apprenant, input[0].prenom3_apprenant);
    assert.deepStrictEqual(foundStatut.ne_pas_solliciter, input[0].ne_pas_solliciter);
    assert.deepStrictEqual(foundStatut.email_contact, input[0].email_contact);
    assert.deepStrictEqual(foundStatut.nom_representant_legal, input[0].nom_representant_legal);
    assert.deepStrictEqual(foundStatut.tel_representant_legal, input[0].tel_representant_legal);
    assert.deepStrictEqual(foundStatut.tel2_representant_legal, input[0].tel2_representant_legal);
    assert.deepStrictEqual(foundStatut.id_formation, input[0].id_formation);
    assert.deepStrictEqual(foundStatut.libelle_court_formation, input[0].libelle_court_formation);
    assert.deepStrictEqual(foundStatut.libelle_long_formation, input[0].libelle_long_formation);
    assert.deepStrictEqual(foundStatut.uai_etablissement, input[0].uai_etablissement);
    assert.deepStrictEqual(foundStatut.siret_etablissement, input[0].siret_etablissement);
    assert.deepStrictEqual(foundStatut.nom_etablissement, input[0].nom_etablissement);
    assert.deepStrictEqual(foundStatut.statut_apprenant, input[0].statut_apprenant);
    assert.deepStrictEqual(foundStatut.source, userApiCreated.username);
  });

  it("Vérifie que la route statut-candidats fonctionne avec un jwt", async () => {
    const { httpClient } = await startServer();
    const userApiCreated = await createApiUser();

    const { data } = await httpClient.post("/api/login", {
      username: userApiCreated.username,
      password: "password",
    });

    // Call Api Route
    const response = await httpClient.post("/api/statut-candidats", [], {
      headers: {
        Authorization: `Bearer ${data.access_token}`,
      },
    });

    // Check Api Route data
    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.data.status, "OK");
  });

  it("Vérifie que la route statut-candidats ne fonctionne pas avec une mauvaise clé d'API", async () => {
    const { httpClient } = await startServer();

    // Create & check api user
    const userApiCreated = await createApiUser();
    assert.deepStrictEqual(userApiCreated.username, "userApi");
    assert.deepStrictEqual(userApiCreated.permissions.length > 0, true);
    assert.deepStrictEqual(userApiCreated.apiKey, goodApiKey);

    // Call Api Route with bad API Key
    const response = await httpClient.post("/api/statut-candidats", createRandomStatutsCandidatsApiInputList(1), {
      headers: {
        "x-api-key": badApiKey,
      },
    });

    assert.deepStrictEqual(response.status, 401);
  });

  it("Vérifie que la route statut-candidats renvoie une 403 pour un user n'ayant pas la permission", async () => {
    const { httpClient } = await startServer();

    // Create a normal user
    const { createUser } = await users();

    const userWithoutPermission = await createUser("normal-user", "passpass", {
      permissions: [],
      apiKey: goodApiKey,
    });
    assert.deepStrictEqual(userWithoutPermission.permissions.length, 0);
    assert.deepStrictEqual(userWithoutPermission.apiKey, goodApiKey);

    const response = await httpClient.post("/api/statut-candidats", [], {
      headers: {
        "x-api-key": goodApiKey,
      },
    });

    assert.deepStrictEqual(response.status, 403);
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

  it("Vérifie l'ajout via route statut-candidats de 50 données randomisées", async () => {
    const { httpClient } = await startServer();

    const nbItemsToTest = 50;

    // Clear statuts in DB
    await StatutCandidat.deleteMany({});

    // Create & check api user
    const userApiCreated = await createApiUser();
    assert.deepStrictEqual(userApiCreated.username, "userApi");
    assert.deepStrictEqual(userApiCreated.permissions.length > 0, true);
    assert.deepStrictEqual(userApiCreated.apiKey, goodApiKey);

    // Generate random data
    const randomDataList = createRandomStatutsCandidatsApiInputList(nbItemsToTest);

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
    const randomDataList = createRandomStatutsCandidatsApiInputList(nbItemsToTest);

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

  it("Vérifie que la route statut-candidats/test fonctionne avec une bonne clé d'API", async () => {
    const { httpClient } = await startServer();

    await createApiUser();

    // Call Api Route
    const response = await httpClient.post(
      "/api/statut-candidats/test",
      {},
      {
        headers: {
          "x-api-key": goodApiKey,
        },
      }
    );

    // Check Api Route data
    assert.deepStrictEqual(response.status, 200);
    assert.deepStrictEqual(response.data.msg, "ok");
  });
});
