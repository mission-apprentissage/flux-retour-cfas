const assert = require("assert").strict;
const httpTests = require("../../utils/httpTests");
const users = require("../../../src/common/components/users");
const { apiRoles } = require("../../../src/common/roles");
const { RcoStatutCandidat, JobEvent } = require("../../../src/common/model");
const { createRandomRcoStatutCandidat } = require("../../data/randomizedSample");
const { jobNames, jobEventStatuts } = require("../../../src/common/model/constants");

const user = { name: "rcoUser", password: "password" };

const createApiUser = async () => {
  const { createUser } = await users();

  return await createUser(user.name, user.password, {
    permissions: [apiRoles.apiStatutsConsumer.anonymousDataConsumer],
  });
};

const getJwtForUser = async (httpClient) => {
  const { data } = await httpClient.post("/api/login", {
    username: user.name,
    password: user.password,
  });
  return data.access_token;
};

httpTests(__filename, ({ startServer }) => {
  it("Vérifie que la route rco/test fonctionne avec un jeton JWT", async () => {
    const { httpClient } = await startServer();
    await createApiUser();
    const accessToken = await getJwtForUser(httpClient);

    // Call Api Route
    const response = await httpClient.get("/api/rco/test", { headers: { Authorization: `Bearer ${accessToken}` } });

    // Check Api Route data
    assert.deepEqual(response.status, 200);
    assert.deepEqual(response.data.msg, "ok");
  });

  it("Vérifie qu'on peut récupérer les statuts RCO en ndjson via rco/rcoStatutsCandidats.ndjson si le Job RCO est terminé", async () => {
    const { httpClient } = await startServer();
    await createApiUser();
    const accessToken = await getJwtForUser(httpClient);

    const uaiTest = "0152290X";

    // Add ended Job Event
    await new JobEvent({
      jobname: jobNames.createRcoStatutsCollection,
      action: jobEventStatuts.ended,
    }).save();

    for (let index = 0; index < 10; index++) {
      await new RcoStatutCandidat({ ...createRandomRcoStatutCandidat(), uai_etablissement: uaiTest }).save();
    }

    // Call Api Route
    const response = await httpClient.get("/api/rco/rcoStatutsCandidats.ndjson?limit=2", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    // Check Api Route data
    assert.deepEqual(response.status, 200);
    let rcoStatutsCandidatsReceived = response.data.split("\n").filter((e) => e);
    assert.strictEqual(rcoStatutsCandidatsReceived.length, 2);
    // assert.deepEqual(JSON.parse(rcoStatutsCandidatsReceived[0]).uai_etablissement, uaiTest);
  });

  it("Vérifie qu'on ne peut pas récupérer les statuts RCO en ndjson via via rco/rcoStatutsCandidats.ndjson lorsque le Job RCO n'est pas terminé", async () => {
    const { httpClient } = await startServer();
    await createApiUser();
    const accessToken = await getJwtForUser(httpClient);

    const uaiTest = "0152290X";

    // Add ended Job Event
    await new JobEvent({
      jobname: jobNames.createRcoStatutsCollection,
      action: jobEventStatuts.started,
    }).save();

    for (let index = 0; index < 10; index++) {
      await new RcoStatutCandidat({ ...createRandomRcoStatutCandidat(), uai_etablissement: uaiTest }).save();
    }

    // Call Api Route
    const response = await httpClient.get("/api/rco/rcoStatutsCandidats.ndjson?limit=2", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    // Check Api Route data
    assert.deepEqual(response.status, 501);
  });
});
