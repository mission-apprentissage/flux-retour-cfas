const assert = require("assert").strict;
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

    assert.deepEqual(response.status, 200);
    assert.deepEqual(response.data.length, Object.values(reseauxCfas).length);
    assert.deepEqual(response.data[0].nom, reseauxCfas.CCCA_BTP.nomReseau);
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
