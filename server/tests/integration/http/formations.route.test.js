const assert = require("assert").strict;
const httpTests = require("../../utils/httpTests");
const { asyncForEach } = require("../../../src/common/utils/asyncUtils");
const { Formation: FormationModel } = require("../../../src/common/model");
const { Formation } = require("../../../src/common/domain/formation");

httpTests(__filename, ({ startServer }) => {
  const formationsSeed = [{ cfd: "01022103", libelle: "EMPLOYE TRAITEUR (CAP)" }];

  const seedFormations = async () => {
    await asyncForEach(formationsSeed, async (formationSeed) => {
      const formation = Formation.create(formationSeed);
      await new FormationModel(formation).save();
    });
  };

  let httpClient;

  beforeEach(async () => {
    const { httpClient: _httpClient } = await startServer();
    httpClient = _httpClient;

    await seedFormations();
  });

  it("sends a 400 HTTP response when no searchTerm provided", async () => {
    const response = await httpClient.post("/api/formations/search", {});

    assert.equal(response.status, 400);
    assert.equal(response.data.message, '"searchTerm" is required');
  });

  it("sends a 400 HTTP response when searchTerm is shorter than 3 chars", async () => {
    const searchTerm = "he";

    const response = await httpClient.post("/api/formations/search", { searchTerm });

    assert.equal(response.status, 400);
  });

  it("sends a 200 HTTP response with results when searchTerm is provided", async () => {
    const response = await httpClient.post("/api/formations/search", { searchTerm: "traiteur" });

    assert.equal(response.status, 200);
    assert.deepEqual(response.data, formationsSeed);
  });
});
