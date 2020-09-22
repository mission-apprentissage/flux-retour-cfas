const assert = require("assert");
const httpTests = require("../../utils/httpTests");
const users = require("../../../src/common/components/users");
const { apiStatutsSeeder } = require("../../../src/common/roles");

httpTests(__filename, ({ startServer }) => {
  it("Vérifie que la route statut-candidats fonctionne avec une bonne clé d'API", async () => {
    const { httpClient } = await startServer();
    const { createUser } = await users();

    const goodApiKey = "12345";

    const created = await createUser("userApi", "password", {
      permissions: [apiStatutsSeeder],
      apiKey: goodApiKey,
    });
    assert.strictEqual(created.username, "userApi");
    assert.strictEqual(created.permissions.length > 0, true);
    assert.strictEqual(created.apiKey, goodApiKey);

    const response = await httpClient.post(
      "/api/statut-candidats",
      { test: "data" },
      {
        headers: {
          "API-Key": goodApiKey,
        },
      }
    );

    assert.strictEqual(response.status, 200);
    assert.ok(response.data.message);
  });

  it("Vérifie que la route statut-candidats ne fonctionne pas avec une mauvaise clé d'API", async () => {
    const { httpClient } = await startServer();
    const { createUser } = await users();

    const badApiKey = "BADAPIKEY";

    const created = await createUser("userApi", "password", {
      permissions: [apiStatutsSeeder],
      apiKey: badApiKey,
    });
    assert.strictEqual(created.username, "userApi");
    assert.strictEqual(created.permissions.length > 0, true);
    assert.strictEqual(created.apiKey, badApiKey);

    const response = await httpClient.post(
      "/api/statut-candidats",
      { test: "data" },
      {
        headers: {
          "API-Key": badApiKey,
        },
      }
    );

    assert.strictEqual(response.status, 200);
    assert.ok(response.data.message);
  });
});
