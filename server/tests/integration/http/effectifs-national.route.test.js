const assert = require("assert").strict;
const { startServer } = require("../../utils/testUtils");

describe(__filename, () => {
  it.only("Verifie si la route fonctionne et verifie si l'objet renvoyé est correct", async () => {
    const { httpClient } = await startServer();
    const response = await httpClient.get("/api/effectifs-national");

    assert.equal(response.status, 200);
    assert.notEqual(response.data.date, null);
    assert.notEqual(response.data.totalOrganismes, null);
    assert.notEqual(response.data.rupturants, null);
    assert.notEqual(response.data.inscritsSansContrat, null);
    assert.notEqual(response.data.abandons, null);
  });
});
