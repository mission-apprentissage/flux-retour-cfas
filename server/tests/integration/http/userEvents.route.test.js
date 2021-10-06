const assert = require("assert");
const httpTests = require("../../utils/httpTests");
const { UserEvent } = require("../../../src/common/model");
const { apiRoles } = require("../../../src/common/roles");

httpTests(__filename, ({ startServer }) => {
  it("Vérifie qu'on peut récupérer les dernières dates des users events via API", async () => {
    const { httpClient, createAndLogUser } = await startServer();
    const bearerToken = await createAndLogUser("user", "password", { permissions: [apiRoles.administrator] });

    // Add events
    const ymagEvent = new UserEvent({
      username: "gesti",
      type: "ftp",
      action: "upload",
    });
    await ymagEvent.save();

    const response = await httpClient.post(
      "/api/userEvents/last-date",
      {
        username: "gesti",
        type: "ftp",
        action: "upload",
      },
      {
        headers: bearerToken,
      }
    );

    assert.strictEqual(response.status, 200);
    // assert.ok(response.data.lastDate);
  });
});
