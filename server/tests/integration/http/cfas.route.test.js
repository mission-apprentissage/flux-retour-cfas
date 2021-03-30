const assert = require("assert").strict;
const omit = require("lodash.omit");
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

  describe("POST /cfas/search", () => {
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

  describe("POST /cfas/data-feedback", () => {
    const validBody = {
      siret: "80320291800022",
      details: "blabla",
      email: "mail@example.com",
      dataIsValid: true,
    };

    it("sends a 400 HTTP response when no data provided", async () => {
      const response = await httpClient.post("/api/cfas/data-feedback");

      assert.equal(response.status, 400);
    });

    it("sends a 400 HTTP response when siret is missing in body", async () => {
      const response = await httpClient.post("/api/cfas/data-feedback", omit(validBody, "siret"));

      assert.equal(response.status, 400);
    });

    it("sends a 400 HTTP response when email is missing in body", async () => {
      const response = await httpClient.post("/api/cfas/data-feedback", omit(validBody, "email"));

      assert.equal(response.status, 400);
    });

    it("sends a 400 HTTP response when details is missing in body", async () => {
      const response = await httpClient.post("/api/cfas/data-feedback", omit(validBody, "details"));

      assert.equal(response.status, 400);
    });

    it("sends a 400 HTTP response when dataIsValid is missing in body", async () => {
      const response = await httpClient.post("/api/cfas/data-feedback", omit(validBody, "dataIsValid"));

      assert.equal(response.status, 400);
    });

    it("sends a 200 HTTP response when feedback was created", async () => {
      const response = await httpClient.post("/api/cfas/data-feedback", validBody);

      assert.equal(response.status, 200);
      assert.deepEqual(omit(response.data, "_id", "__v", "created_at"), {
        siret: validBody.siret,
        details: validBody.details,
        email: validBody.email,
        donnee_est_valide: validBody.dataIsValid,
      });
    });
  });
});
