const assert = require("assert").strict;
const httpTests = require("../../utils/httpTests");
const { createRandomStatutCandidat } = require("../../data/randomizedSample");
const { StatutCandidat: StatutCandidatModel } = require("../../../src/common/model");
const { buildTokenizedString } = require("../../../src/common/utils/buildTokenizedString");

httpTests(__filename, ({ startServer }) => {
  let httpClient;

  beforeEach(async () => {
    const { httpClient: _httpClient } = await startServer();
    httpClient = _httpClient;
  });

  it("sends a 400 HTTP response when no searchTerm provided", async () => {
    const response = await httpClient.post("/api/cfas/search", {});

    assert.equal(response.status, 400);
    assert.equal(response.data.message, '"searchTerm" is required');
  });

  it("sends a 200 HTTP empty response when no match", async () => {
    const response = await httpClient.post("/api/cfas/search", { searchTerm: "blabla" });

    assert.equal(response.status, 200);
    assert.deepEqual(response.data, []);
  });

  it("sends a 200 HTTP response with results when match", async () => {
    await new StatutCandidatModel({
      ...createRandomStatutCandidat(),
      nom_etablissement: "FACULTE SCIENCES NANCY",
      nom_etablissement_tokenized: buildTokenizedString("FACULTE SCIENCES NANCY", 3),
      siret_etablissement_valid: true,
    }).save();

    const response = await httpClient.post("/api/cfas/search", { searchTerm: "FACULTE" });

    assert.equal(response.status, 200);
    assert.equal(response.data.length, 1);
    assert.deepEqual(response.data[0].nom_etablissement, "FACULTE SCIENCES NANCY");
  });
});
