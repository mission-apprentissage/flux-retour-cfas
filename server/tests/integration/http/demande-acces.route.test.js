const assert = require("assert").strict;
const httpTests = require("../../utils/httpTests");
const { DemandeAccesModel } = require("../../../src/common/model");

httpTests(__filename, ({ startServer }) => {
  let httpClient;

  beforeEach(async () => {
    const { httpClient: _httpClient } = await startServer();
    httpClient = _httpClient;
  });

  describe("POST /demande-acces", () => {
    it("sends a 400 HTTP response when no body provided", async () => {
      const response = await httpClient.post("/api/demande-acces", {});

      assert.equal(response.status, 400);
      const found = await DemandeAccesModel.countDocuments();
      assert.equal(found, 0);
    });

    it("sends a 200 HTTP response when demande acces was created", async () => {
      const response = await httpClient.post("/api/demande-acces", {
        profil: "DREETS",
        region: "Corse",
        email: "example@mail.com",
      });

      assert.equal(response.status, 200);
      const found = await DemandeAccesModel.find().lean();
      assert.equal(found.length, 1);
    });
  });
});
