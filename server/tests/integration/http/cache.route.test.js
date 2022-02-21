const assert = require("assert").strict;
const { startServer } = require("../../utils/testUtils");

describe(__filename, () => {
  describe("POST /cache/clear", () => {
    it("sends a 403 HTTP response when caller is not admin", async () => {
      const { httpClient, createAndLogUser } = await startServer();
      const authHeaders = await createAndLogUser("user", "password", { permissions: [] });

      const response = await httpClient.post("/api/cache/clear", {}, { headers: authHeaders });
      assert.equal(response.status, 403);
    });
  });
});
