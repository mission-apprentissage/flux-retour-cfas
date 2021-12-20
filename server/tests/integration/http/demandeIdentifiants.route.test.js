const assert = require("assert").strict;
const httpTests = require("../../utils/httpTests");
const { DemandeIdentifiantsModel } = require("../../../src/common/model");

httpTests(__filename, ({ startServer }) => {
  let httpClient;

  beforeEach(async () => {
    const { httpClient: _httpClient } = await startServer();
    httpClient = _httpClient;
  });

  describe("POST /demande-identifiants", () => {
    it("sends a 400 HTTP response when no body provided", async () => {
      const response = await httpClient.post("/api/demande-identifiants", {});

      assert.equal(response.status, 400);
      const found = await DemandeIdentifiantsModel.countDocuments();
      assert.equal(found, 0);
    });

    it("sends a 200 HTTP response when demande identifiants was created", async () => {
      const response = await httpClient.post("/api/demande-identifiants", {
        profil: "DREETS",
        region: "Corse",
        email: "example@mail.com",
      });

      assert.equal(response.status, 200);
      const found = await DemandeIdentifiantsModel.find().lean();
      assert.equal(found.length, 1);
    });
  });
});
