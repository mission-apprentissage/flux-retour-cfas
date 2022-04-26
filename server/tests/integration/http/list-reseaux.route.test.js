const assert = require("assert").strict;
const { RESEAUX_CFAS } = require("../../../src/common/constants/networksConstants");
// eslint-disable-next-line node/no-unpublished-require
const { startServer } = require("../../utils/testUtils");

describe(__filename, () => {
  describe("GET /list-reseaux", () => {
    it("sends a 200 HTTP response with list of network", async () => {
      const { httpClient } = await startServer();

      const response = await httpClient.get("/api/list-reseaux");
      assert.equal(response.status, 200);
      assert.equal(response.data[0].nomReseau, RESEAUX_CFAS.CMA.nomReseau);
      assert.equal(response.data[1].nomReseau, RESEAUX_CFAS.UIMM.nomReseau);
      assert.equal(response.data[2].nomReseau, RESEAUX_CFAS.AGRI.nomReseau);
      assert.equal(response.data[3].nomReseau, RESEAUX_CFAS.MFR.nomReseau);
      assert.equal(response.data[4].nomReseau, RESEAUX_CFAS.CCI.nomReseau);
      assert.equal(response.data[5].nomReseau, RESEAUX_CFAS.CFA_EC.nomReseau);
      assert.equal(response.data[6].nomReseau, RESEAUX_CFAS.GRETA.nomReseau);
      assert.equal(response.data[7].nomReseau, RESEAUX_CFAS.AFTRAL.nomReseau);
    });
  });
});
