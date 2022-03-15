const assert = require("assert").strict;
const { startServer } = require("../../utils/testUtils");
const users = require("../../../src/common/components/users");
const { apiRoles } = require("../../../src/common/roles");
const { DossierApprenantModel } = require("../../../src/common/model");
const {
  createRandomDossierApprenantApiInputList,
  createRandomDossierApprenantApiInput,
} = require("../../data/randomizedSample");
const { cfdRegex } = require("../../../src/common/domain/cfd");

const user = {
  name: "userApi",
  password: "password",
};
const createApiUser = async () => {
  const { createUser } = await users();

  return await createUser({ username: user.name, password: user.password, permissions: [apiRoles.apiStatutsSeeder] });
};

const getJwtForUser = async (httpClient) => {
  const { data } = await httpClient.post("/api/login", {
    username: user.name,
    password: user.password,
  });
  return data.access_token;
};

describe(__filename, () => {
  it("Vérifie que la route /dossiers-apprenants fonctionne avec un tableau vide", async () => {
    const { httpClient } = await startServer();
    await createApiUser();
    const accessToken = await getJwtForUser(httpClient);

    // Call Api Route
    const response = await httpClient.post("/api/dossiers-apprenants", [], {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // Check Api Route data
    assert.equal(response.status, 200);
    assert.equal(response.data.status, "OK");
  });

  it("Vérifie que la route /dossiers-apprenants renvoie une 401 pour un user non authentifié", async () => {
    const { httpClient } = await startServer();

    const response = await httpClient.post("/api/dossiers-apprenants", [], {
      headers: {
        Authorization: "",
      },
    });

    assert.deepEqual(response.status, 401);
  });

  it("Vérifie que la route /dossiers-apprenants renvoie une 403 pour un user n'ayant pas la permission", async () => {
    const { httpClient } = await startServer();

    // Create a normal user
    const { createUser } = await users();

    const userWithoutPermission = await createUser({
      username: "normal-user",
      password: "password",
      permissions: [],
    });
    assert.deepEqual(userWithoutPermission.permissions.length, 0);

    const { data } = await httpClient.post("/api/login", {
      username: userWithoutPermission.username,
      password: "password",
    });

    // Call Api Route
    const response = await httpClient.post("/api/dossiers-apprenants", [], {
      headers: {
        Authorization: `Bearer ${data.access_token}`,
      },
    });

    assert.deepEqual(response.status, 403);
  });

  const requiredFields = [
    "prenom_apprenant",
    "nom_apprenant",
    "id_formation",
    "uai_etablissement",
    "statut_apprenant",
    "annee_scolaire",
    "date_metier_mise_a_jour_statut",
  ];
  requiredFields.forEach((requiredField) => {
    it(`Vérifie qu'on ne crée pas de donnée et renvoie une 200 + ERROR lorsque le champ obligatoire '${requiredField}' n'est pas renseigné`, async () => {
      const { httpClient } = await startServer();
      await createApiUser();
      const accessToken = await getJwtForUser(httpClient);

      // set required field as undefined
      const input = [createRandomDossierApprenantApiInput({ [requiredField]: undefined })];
      // perform request
      const response = await httpClient.post("/api/dossiers-apprenants", input, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      // check response
      assert.equal(response.status, 200);
      assert.equal(response.data.status, "ERROR");
      assert.equal(response.data.message.includes(`Error : 1 items not valid`), true);
      assert.equal(response.data.ok, 0);
      assert.equal(response.data.ko, 1);
      assert.equal(response.data.validationErrors.length, 1);
      assert.equal(response.data.validationErrors[0].details.length, 1);
      assert.equal(
        response.data.validationErrors[0].details[0].message.includes(`${requiredField}" is required`),
        true
      );

      // check that no data was created
      assert.equal(await DossierApprenantModel.countDocuments({}), 0);
    });
  });

  it("Vérifie qu'on ne crée pas de donnée et renvoie une 400 lorsque le champ annee_scolaire ne respecte pas le format", async () => {
    const { httpClient } = await startServer();
    await createApiUser();
    const accessToken = await getJwtForUser(httpClient);

    // set required field as undefined
    const input = [createRandomDossierApprenantApiInput({ annee_scolaire: "2021,2022" })];
    // perform request
    const response = await httpClient.post("/api/dossiers-apprenants", input, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    // check response
    assert.equal(response.data.status, "ERROR");
    assert.equal(response.data.validationErrors.length, 1);
    assert.equal(
      response.data.validationErrors[0].details[0].message.includes(
        '"annee_scolaire" with value "2021,2022" fails to match the required pattern'
      ),
      true
    );
    // check that no data was created
    assert.equal(await DossierApprenantModel.countDocuments({}), 0);
  });

  it("Vérifie qu'on ne crée pas de donnée et renvoie une 400 lorsque le champ uai_etablissement ne respecte pas le format", async () => {
    const { httpClient } = await startServer();
    await createApiUser();
    const accessToken = await getJwtForUser(httpClient);

    const input = [createRandomDossierApprenantApiInput({ uai_etablissement: "invalide" })];
    // perform request
    const response = await httpClient.post("/api/dossiers-apprenants", input, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    // check response
    assert.equal(response.data.status, "ERROR");
    assert.equal(response.data.validationErrors.length, 1);
    assert.equal(
      response.data.validationErrors[0].details[0].message.includes(
        '"uai_etablissement" with value "invalide" fails to match the required pattern'
      ),
      true
    );
    // check that no data was created
    assert.equal(await DossierApprenantModel.countDocuments({}), 0);
  });

  const invalidDates = ["2020", "2020-10", "2020-10-", "2020-10-1", "13/11/2020", "abc", true];
  invalidDates.forEach((invalidDate) => {
    it(`Vérifie qu'on ne crée pas de donnée et renvoie une 400 lorsque les champs date ne sont pas iso (${invalidDate})`, async () => {
      const { httpClient } = await startServer();
      await createApiUser();
      const accessToken = await getJwtForUser(httpClient);

      // set required field as undefined
      const input = [
        createRandomDossierApprenantApiInput({
          date_metier_mise_a_jour_statut: invalidDate,
        }),
      ];
      // perform request
      const response = await httpClient.post("/api/dossiers-apprenants", input, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      // check response
      assert.equal(response.data.status, "ERROR");
      assert.equal(response.data.validationErrors.length, 1);
      assert.equal(
        response.data.validationErrors[0].details[0].message.includes("date_metier_mise_a_jour_statut"),
        true
      );
      // check that no data was created
      assert.equal(await DossierApprenantModel.countDocuments({}), 0);
    });
  });

  it("Vérifie l'ajout via route /dossiers-apprenants de données complètes", async () => {
    const { httpClient } = await startServer();
    await createApiUser();
    const accessToken = await getJwtForUser(httpClient);

    const input = createRandomDossierApprenantApiInputList(20);

    // Call Api Route
    const response = await httpClient.post("/api/dossiers-apprenants", input, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // Check Api Route data
    assert.equal(response.status, 200);
    assert.equal(response.data.status, "OK");
    assert.equal(response.data.message, "Success");
  });

  it("Vérifie l'ajout via route /dossiers-apprenants de 20 données randomisées", async () => {
    const { httpClient } = await startServer();
    await createApiUser();
    const accessToken = await getJwtForUser(httpClient);

    const nbItemsToTest = 20;
    // Generate random data
    const randomDataList = createRandomDossierApprenantApiInputList(nbItemsToTest);

    // Call Api Route
    const response = await httpClient.post("/api/dossiers-apprenants", randomDataList, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // Check Api Route data
    assert.deepEqual(response.status, 200);
    assert.ok(response.data.status);
    assert.ok(response.data.message);
    assert.deepEqual(response.data.status, "OK");

    // Check Nb Items added
    assert.deepEqual(await DossierApprenantModel.countDocuments({}), nbItemsToTest);
  });

  it("Vérifie l'erreur d'ajout via route /dossiers-apprenants pour un trop grande nb de données randomisées (>100)", async () => {
    const { httpClient } = await startServer();
    await createApiUser();
    const accessToken = await getJwtForUser(httpClient);

    const nbItemsToTest = 200;

    // Generate random data
    const randomDataList = createRandomDossierApprenantApiInputList(nbItemsToTest);

    const response = await httpClient.post("/api/dossiers-apprenants", randomDataList, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // Check Api Route data & Data not added
    assert.deepEqual(response.status, 413);
    assert.equal(await DossierApprenantModel.countDocuments({}), 0);
  });

  it("Vérifie l'ajout via route /dossiers-apprenants de 10 statuts valides et 3 statuts invalides", async () => {
    const { httpClient } = await startServer();
    await createApiUser();
    const accessToken = await getJwtForUser(httpClient);

    // Generate random valid & invalid data
    const nbValidItems = 10;
    const randomValidAndInvalidData = [
      ...createRandomDossierApprenantApiInputList(nbValidItems),
      ...[
        createRandomDossierApprenantApiInput({ prenom_apprenant: null }),
        createRandomDossierApprenantApiInput({ date_metier_mise_a_jour_statut: true }),
        createRandomDossierApprenantApiInput({ id_formation: 72 }),
      ],
    ];

    // Call Api Route
    const response = await httpClient.post("/api/dossiers-apprenants", randomValidAndInvalidData, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // Check Api Route data
    assert.deepEqual(response.status, 200);
    assert.equal(response.data.status, "ERROR");
    assert.equal(response.data.message.includes(`Error : 3 items not valid`), true);
    assert.deepEqual(response.data.ok, 10);
    assert.deepEqual(response.data.ko, 3);
    assert.equal(response.data.validationErrors.length, 3);

    // Check Nb Items added
    assert.deepEqual(await DossierApprenantModel.countDocuments({}), nbValidItems);
  });

  it("Vérifie l'ajout via route /dossiers-apprenants d'un statut avec champs non renseignés dans le schéma mais ignorés en base", async () => {
    const { httpClient } = await startServer();
    await createApiUser();
    const accessToken = await getJwtForUser(httpClient);

    // Generate random statut and add unknown key
    const unknownKeyName = "prenom_apprenant2";
    const payload = [{ ...createRandomDossierApprenantApiInput(), [unknownKeyName]: "should not be stored" }];

    // Call Api Route
    const response = await httpClient.post("/api/dossiers-apprenants", payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // Check Api Route data
    assert.equal(response.status, 200);
    assert.equal(response.data.status, "OK");
    assert.equal(response.data.ok, 1);

    const allStatuts = await DossierApprenantModel.find().lean();
    const createdStatut = allStatuts[0];
    assert.equal(createdStatut[unknownKeyName], undefined);
  });

  it("Vérifie que la route /dossiers-apprenants/test fonctionne avec un jeton JWT", async () => {
    const { httpClient } = await startServer();
    await createApiUser();
    const accessToken = await getJwtForUser(httpClient);

    // Call Api Route
    const response = await httpClient.post(
      "/api/dossiers-apprenants/test",
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    // Check Api Route data
    assert.deepEqual(response.status, 200);
    assert.deepEqual(response.data.msg, "ok");
  });

  it("Vérifie l'ajout via route /dossiers-apprenants pour un statut avec bon code CFD (id_formation)", async () => {
    const { httpClient } = await startServer();
    await createApiUser();
    const accessToken = await getJwtForUser(httpClient);

    const goodCfd = "50033610";

    // Generate random data with good cfd
    const simpleStatutWithGoodCfd = { ...createRandomDossierApprenantApiInput(), id_formation: goodCfd };

    const response = await httpClient.post("/api/dossiers-apprenants", [simpleStatutWithGoodCfd], {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // Check data added
    assert.deepEqual(response.status, 200);
    assert.ok(response.data.status);
    assert.ok(response.data.message);
    assert.deepEqual(response.data.status, "OK");

    // Check Nb Items added
    assert.deepEqual(await DossierApprenantModel.countDocuments({}), 1);
  });

  it("Vérifie l'erreur d'ajout via route /dossiers-apprenants pour un statut avec mauvais code CFD (id_formation)", async () => {
    const { httpClient } = await startServer();
    await createApiUser();
    const accessToken = await getJwtForUser(httpClient);

    const badCfd = "abc123456";

    // Generate random data with bad cfd
    const simpleStatutWithBadCfd = { ...createRandomDossierApprenantApiInput(), id_formation: badCfd };

    const response = await httpClient.post("/api/dossiers-apprenants", [simpleStatutWithBadCfd], {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // check response & validation errors
    assert.equal(response.data.status, "ERROR");
    assert.equal(response.data.validationErrors.length, 1);
    assert.equal(
      response.data.validationErrors[0].details[0].message.includes(
        `"id_formation" with value "${badCfd}" fails to match the required pattern: ${cfdRegex}`
      ),
      true
    );
    assert.equal(await DossierApprenantModel.countDocuments({}), 0);
  });
});
