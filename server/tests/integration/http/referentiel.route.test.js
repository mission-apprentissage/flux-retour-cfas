const assert = require("assert").strict;
const httpTests = require("../../utils/httpTests");
const { reseauxCfas, regionsCfas } = require("../../../src/common/model/constants");

httpTests(__filename, ({ startServer }) => {
  it("Vérifie qu'on peut récupérer les réseaux référentiels via API", async () => {
    const { httpClient } = await startServer();

    const response = await httpClient.get("/api/referentiel/networks");

    assert.deepStrictEqual(response.status, 200);
    assert.deepEqual(response.data.length, Object.values(reseauxCfas).length);
    assert.deepEqual(response.data[0].nom, reseauxCfas.ANASUP.nomReseau);
  });

  it("Vérifie qu'on peut récupérer les numéro de régions des CFA référentiels via API", async () => {
    const { httpClient } = await startServer();

    const response = await httpClient.get("/api/referentiel/regions-cfas");

    assert.deepStrictEqual(response.status, 200);
    assert.deepEqual(response.data.length, Object.values(regionsCfas).length);
    assert.deepEqual(response.data[0].num, regionsCfas.NORMANDIE.numRegion);
    assert.deepEqual(response.data[0].nom, regionsCfas.NORMANDIE.nomRegion);
  });

  it("Vérifie qu'on peut récupérer les numéro de régions des CFA référentiels via API", async () => {
    const { httpClient } = await startServer();

    const response = await httpClient.get("/api/referentiel/regions-cfas");

    assert.deepStrictEqual(response.status, 200);
    assert.deepEqual(response.data.length, Object.values(regionsCfas).length);
    assert.deepEqual(response.data[0].num, regionsCfas.NORMANDIE.numRegion);
    assert.deepEqual(response.data[0].nom, regionsCfas.NORMANDIE.nomRegion);
  });
});
