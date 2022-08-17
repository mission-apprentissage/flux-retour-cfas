const assert = require("assert").strict;
const { startServer } = require("../../utils/testUtils");

describe(__filename, () => {
  it("Verifie si on la route fonctionne et verifie que l'objet renvoyé correct", async () => {
    const { httpClient } = await startServer();
    const response = await httpClient.get("/api/effectifs-publics");

    assert.equal(response.status, 200);
    assert.notEqual(response.data.date, null);
    assert.notEqual(response.data.totalOrganismes, null);
    assert.notEqual(response.data.rupturants, null);
    assert.notEqual(response.data.inscritsSansContrat, null);
    assert.notEqual(response.data.abandons, null);
  });
});
