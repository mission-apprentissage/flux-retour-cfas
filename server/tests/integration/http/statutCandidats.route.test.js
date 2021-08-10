const assert = require("assert").strict;
const httpTests = require("../../utils/httpTests");
const users = require("../../../src/common/components/users");
const { apiStatutsSeeder } = require("../../../src/common/roles");
const { StatutCandidat } = require("../../../src/common/model");
const { createRandomStatutsCandidatsApiInputList } = require("../../data/randomizedSample");
const { nockGetCfdInfo } = require("../../utils/nockApis/nock-tablesCorrespondances");
const { nockGetMetiersByCfd } = require("../../utils/nockApis/nock-Lba");

const user = {
  name: "userApi",
  password: "password",
};
const createApiUser = async () => {
  const { createUser } = await users();

  return await createUser(user.name, user.password, {
    permissions: [apiStatutsSeeder],
  });
};

const getJwtForUser = async (httpClient) => {
  const { data } = await httpClient.post("/api/login", {
    username: user.name,
    password: user.password,
  });
  return data.access_token;
};

httpTests(__filename, ({ startServer }) => {
  beforeEach(() => {
    nockGetCfdInfo();
    nockGetMetiersByCfd();
  });

  it("Vérifie que la route statut-candidats fonctionne avec un tableau vide", async () => {
    const { httpClient } = await startServer();
    await createApiUser();
    const accessToken = await getJwtForUser(httpClient);

    // Call Api Route
    const response = await httpClient.post("/api/statut-candidats", [], {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // Check Api Route data
    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.data.status, "OK");
  });

  it("Vérifie que la route statut-candidats renvoie une 403 pour un user n'ayant pas la permission", async () => {
    const { httpClient } = await startServer();

    // Create a normal user
    const { createUser } = await users();

    const userWithoutPermission = await createUser("normal-user", "password", {
      permissions: [],
    });
    assert.deepEqual(userWithoutPermission.permissions.length, 0);

    const { data } = await httpClient.post("/api/login", {
      username: userWithoutPermission.username,
      password: "password",
    });

    // Call Api Route
    const response = await httpClient.post("/api/statut-candidats", [], {
      headers: {
        Authorization: `Bearer ${data.access_token}`,
      },
    });

    assert.deepEqual(response.status, 403);
  });

  it("Vérifie l'ajout via route statut-candidats de données complètes", async () => {
    const { httpClient } = await startServer();
    await createApiUser();
    const accessToken = await getJwtForUser(httpClient);

    const input = createRandomStatutsCandidatsApiInputList(20);

    // Call Api Route
    const response = await httpClient.post("/api/statut-candidats", input, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // Check Api Route data
    assert.equal(response.status, 200);
    assert.equal(response.data.status, "OK");
    assert.equal(response.data.message, "Success");
  });

  it("Vérifie l'ajout via route statut-candidats de 50 données randomisées", async () => {
    const { httpClient } = await startServer();
    await createApiUser();
    const accessToken = await getJwtForUser(httpClient);

    const nbItemsToTest = 50;
    // Generate random data
    const randomDataList = createRandomStatutsCandidatsApiInputList(nbItemsToTest);

    // Call Api Route
    const response = await httpClient.post("/api/statut-candidats", randomDataList, {
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
    assert.deepEqual(await StatutCandidat.countDocuments({}), nbItemsToTest);
  });

  it("Vérifie l'erreur d'ajout via route statut-candidats pour un trop grande nb de données randomisées (>100)", async () => {
    const { httpClient } = await startServer();
    await createApiUser();
    const accessToken = await getJwtForUser(httpClient);

    const nbItemsToTest = 200;

    // Generate random data
    const randomDataList = createRandomStatutsCandidatsApiInputList(nbItemsToTest);

    const response = await httpClient.post("/api/statut-candidats", randomDataList, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // Check Api Route data & Data not added
    assert.deepEqual(response.status, 413);
    assert.notDeepEqual(await StatutCandidat.countDocuments({}), nbItemsToTest);
  });

  it("Vérifie que la route statut-candidats/test fonctionne avec un jeton JWT", async () => {
    const { httpClient } = await startServer();
    await createApiUser();
    const accessToken = await getJwtForUser(httpClient);

    // Call Api Route
    const response = await httpClient.post(
      "/api/statut-candidats/test",
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
});
