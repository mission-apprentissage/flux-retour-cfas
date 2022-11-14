const assert = require("assert").strict;
const { startServer } = require("../../utils/testUtils");
const { apiRoles } = require("../../../src/common/roles");
const users = require("../../../src/common/components/users");
const { cfasDb } = require("../../../src/common/model/collections");

const user = {
  name: "erpUser",
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
  it("Vérifie que la route liens-prives-cfas renvoie une 401 pour un user non authentifié", async () => {
    const { httpClient } = await startServer();

    const response = await httpClient.get("/api/liens-prives-cfas", {
      headers: {
        Authorization: "",
      },
    });

    assert.deepEqual(response.status, 401);
  });

  it("Vérifie que la route liens-prives-cfas renvoie une 403 pour un user n'ayant pas la permission", async () => {
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
    const response = await httpClient.get("/api/liens-prives-cfas", {
      headers: {
        Authorization: `Bearer ${data.access_token}`,
      },
    });

    assert.deepEqual(response.status, 403);
  });

  it("Vérifie que la route liens-prives-cfas fonctionne avec un jeton JWT", async () => {
    const { httpClient } = await startServer();
    await createApiUser();
    const accessToken = await getJwtForUser(httpClient);

    const response = await httpClient.get("/api/liens-prives-cfas", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    assert.deepEqual(response.status, 200);
  });

  it("Vérifie que la route liens-prives-cfas renvoi un cfa avec url privée - sans pagination", async () => {
    const { httpClient } = await startServer();
    await createApiUser();
    const accessToken = await getJwtForUser(httpClient);

    await cfasDb().insertOne({
      uai: "0451582A",
      sirets: ["31521327200067"],
      created_at: new Date(),
      nom: "TEST CFA",
      erps: [user.name],
      private_url: "http://test",
    });

    // Call api route
    const response = await httpClient.get("/api/liens-prives-cfas", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const expected = [
      {
        uai: "0451582A",
        nom: "TEST CFA",
        private_url: "http://test?source=ERP",
      },
    ];

    // Check Api Route data
    assert.deepEqual(response.status, 200);
    assert.deepEqual(response.data.cfasWithPrivateLink.length, 1);
    assert.deepEqual(response.data.cfasWithPrivateLink, expected);
    assert.deepEqual(response.data.pagination.nombre_de_page, 1);
    assert.deepEqual(response.data.pagination.page, 1);
    assert.deepEqual(response.data.pagination.resultats_par_page, 100);
    assert.deepEqual(response.data.pagination.total, 1);
  });

  it("Vérifie que la route liens-prives-cfas renvoi une liste de cfas avec urls privées et avec pagination", async () => {
    const { httpClient } = await startServer();
    await createApiUser();
    const accessToken = await getJwtForUser(httpClient);

    // Add 4 cfas for this ERP - 1 Cfa for other erp
    await cfasDb().insertOne({
      uai: "0451582A",
      sirets: ["31521327200061"],
      nom: "TEST CFA",
      erps: [user.name],
      private_url: "http://test",
      created_at: new Date(),
    });
    await cfasDb().insertOne({
      uai: "0451582B",
      sirets: ["99921327200062"],
      nom: "TEST CFA 2",
      erps: [user.name],
      private_url: "http://test2",
      created_at: new Date(),
    });
    await cfasDb().insertOne({
      uai: "0451582C",
      sirets: ["99921327200063"],
      nom: "TEST CFA 3",
      erps: [user.name],
      private_url: "http://test3",
      created_at: new Date(),
    });
    await cfasDb().insertOne({
      uai: "0451582D",
      sirets: ["99921327200064"],
      nom: "TEST CFA 4",
      erps: [user.name],
      private_url: "http://test4",
      created_at: new Date(),
    });
    await cfasDb().insertOne({
      uai: "0451582E",
      sirets: ["11121327200065"],
      nom: "TEST CFA 5",
      erps: ["BAD_ERP"],
      private_url: "http://test5",
      created_at: new Date(),
    });

    // Call api route with 1 page & 2 elements max per page
    const response = await httpClient.get("/api/liens-prives-cfas?page=1&limit=2", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    // Check Api Route data
    assert.deepEqual(response.status, 200);
    assert.deepEqual(response.data.cfasWithPrivateLink.length, 2);
    assert.deepEqual(response.data.pagination.nombre_de_page, 2);
    assert.deepEqual(response.data.pagination.page, 1);
    assert.deepEqual(response.data.pagination.resultats_par_page, 2);
    assert.deepEqual(response.data.pagination.total, 4);
  });

  it("Vérifie que la route liens-prives-cfas renvoi une liste de cfas avec urls privées avec pagination et filtrage via liste d'uais", async () => {
    const { httpClient } = await startServer();
    await createApiUser();
    const accessToken = await getJwtForUser(httpClient);

    const uaiTest1 = "0451582A";
    const uaiTest2 = "0451582B";

    // Add 4 Cfas - only 2 with test UAI to search
    await cfasDb().insertOne({
      uai: uaiTest1,
      sirets: ["31521327200061"],
      nom: "TEST CFA",
      erps: [user.name],
      private_url: "http://test",
      created_at: new Date(),
    });
    await cfasDb().insertOne({
      uai: uaiTest2,
      sirets: ["99921327200062"],
      nom: "TEST CFA 2",
      erps: [user.name],
      private_url: "http://test2",
      created_at: new Date(),
    });
    await cfasDb().insertOne({
      uai: "0451582C",
      sirets: ["99921327200063"],
      nom: "TEST CFA 3",
      erps: [user.name],
      private_url: "http://test3",
      created_at: new Date(),
    });
    await cfasDb().insertOne({
      uai: "0451582D",
      sirets: ["99921327200064"],
      nom: "TEST CFA 4",
      erps: [user.name],
      private_url: "http://test4",
      created_at: new Date(),
    });

    // Call api route with uaiTest1 & uaiTest2 filters
    const response = await httpClient.get(
      `/api/liens-prives-cfas?page=1&limit=20&uais[0]=${uaiTest1}&uais[1]=${uaiTest2}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    // Check Api Route data
    assert.deepEqual(response.status, 200);
    assert.deepEqual(response.data.cfasWithPrivateLink.length, 2);
    assert.deepEqual(response.data.pagination.nombre_de_page, 1);
    assert.deepEqual(response.data.pagination.page, 1);
    assert.deepEqual(response.data.pagination.resultats_par_page, 20);
    assert.deepEqual(response.data.pagination.total, 2);
  });

  it("Vérifie que la route liens-prives-cfas ne renvoie rien pour un user n'ayant aucun CFA lié", async () => {
    const { httpClient } = await startServer();
    await createApiUser();
    const accessToken = await getJwtForUser(httpClient);

    await cfasDb().insertOne({
      uai: "0451582A",
      sirets: ["31521327200067"],
      nom: "TEST CFA",
      erps: ["BAD_ERP"],
      private_url: "http://test",
      created_at: new Date(),
    });

    // Call api route
    const response = await httpClient.get("/api/liens-prives-cfas", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    // Check Api Route data
    assert.deepEqual(response.status, 200);
    assert.deepEqual(response.data.cfasWithPrivateLink.length, 0);
  });
});
