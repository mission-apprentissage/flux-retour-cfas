const assert = require("assert");
const httpTests = require("../../utils/httpTests");
const { reseauxCfas, jobNames } = require("../../../src/common/model/constants");
const { administrator } = require("../../../src/common/roles");

httpTests(__filename, ({ startServer }) => {
  it("Vérifie qu'on peut récupérer les réseaux référentiels via API", async () => {
    const { httpClient, createAndLogUser } = await startServer();
    const bearerToken = await createAndLogUser("user", "password", { permissions: [administrator] });

    const response = await httpClient.get("/api/referentiel/networks", {
      headers: bearerToken,
    });

    assert.deepStrictEqual(response.status, 200);
    assert.ok(response.data.networks);
    assert.deepStrictEqual(response.data.networks, reseauxCfas);
  });

  it("Vérifie qu'on peut récupérer les noms des jobs via API", async () => {
    const { httpClient, createAndLogUser } = await startServer();
    const bearerToken = await createAndLogUser("user", "password", { permissions: [administrator] });

    const response = await httpClient.get("/api/referentiel/jobNames", {
      headers: bearerToken,
    });

    assert.deepStrictEqual(response.status, 200);
    assert.ok(response.data.jobNames);
    assert.deepStrictEqual(response.data.jobNames, jobNames);
  });
});
