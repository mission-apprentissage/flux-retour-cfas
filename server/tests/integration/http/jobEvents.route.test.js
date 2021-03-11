const assert = require("assert");
const httpTests = require("../../utils/httpTests");
const { administrator } = require("../../../src/common/roles");
const { JobEvent } = require("../../../src/common/model");

httpTests(__filename, ({ startServer }) => {
  it("Vérifie qu'on peut récupérer les jobs events via API", async () => {
    const { httpClient, createAndLogUser } = await startServer();
    const bearerToken = await createAndLogUser("user", "password", { permissions: [administrator] });

    // Add events
    const testJobEvent = new JobEvent({
      jobname: "Test",
      action: "Test",
    });
    await testJobEvent.save();

    const response = await httpClient.post(
      "/api/jobEvents",
      {},
      {
        headers: bearerToken,
      }
    );

    assert.deepStrictEqual(response.status, 200);
    assert.ok(response.data.jobEvents);
    assert.ok(response.data.pagination);
    assert.ok(response.data.pagination.page);
    assert.ok(response.data.pagination.resultats_par_page);
    assert.ok(response.data.pagination.nombre_de_page);
    assert.ok(response.data.pagination.total);
    assert.deepStrictEqual(response.data.pagination.total, 1);
  });
});
