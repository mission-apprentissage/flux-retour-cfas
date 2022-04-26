const assert = require("assert").strict;
const { RESEAUX_CFAS } = require("../../../src/common/constants/networksConstants");
// eslint-disable-next-line node/no-unpublished-require
const { startServer } = require("../../utils/testUtils");

describe(__filename, () => {
  describe("GET /list-reseaux", () => {
    it("sends a 200 HTTP response with list of network", async () => {
      const { httpClient } = await startServer();

      const response = await httpClient.get("/api/list-reseaux");

      assert.deepEqual(response.data, RESEAUX_CFAS);
      assert.equal(response.status, 200);
    });
  });
});
