const assert = require("assert").strict;
const { demandesIdentifiantsDb } = require("../../../src/common/model/collections");
const { startServer } = require("../../utils/testUtils");

describe(__filename, () => {
  let httpClient;

  beforeEach(async () => {
    const { httpClient: _httpClient } = await startServer();
    httpClient = _httpClient;
  });

  describe("POST /demande-identifiants", () => {
    it("sends a 400 HTTP response when no body provided", async () => {
      const response = await httpClient.post("/api/demande-identifiants", {});

      assert.equal(response.status, 400);
      const found = await demandesIdentifiantsDb().countDocuments();
      assert.equal(found, 0);
    });

    it("sends a 200 HTTP response when demande identifiants was created", async () => {
      const response = await httpClient.post("/api/demande-identifiants", {
        profil: "DREETS",
        region: "Corse",
        email: "example@mail.com",
      });

      assert.equal(response.status, 200);
      const found = await demandesIdentifiantsDb().find().toArray();
      assert.equal(found.length, 1);
    });
  });
});
