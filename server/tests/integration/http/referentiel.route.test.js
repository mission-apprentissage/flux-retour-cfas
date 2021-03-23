const assert = require("assert").strict;
const httpTests = require("../../utils/httpTests");
const { reseauxCfas } = require("../../../src/common/model/constants");

httpTests(__filename, ({ startServer }) => {
  it("Vérifie qu'on peut récupérer les réseaux référentiels via API", async () => {
    const { httpClient } = await startServer();

    const response = await httpClient.get("/api/referentiel/networks");

    assert.deepStrictEqual(response.status, 200);
    assert.deepEqual(response.data.length, Object.values(reseauxCfas).length);
    assert.deepEqual(response.data[0].nom, reseauxCfas.CCCA_BTP.nomReseau);
  });
});
