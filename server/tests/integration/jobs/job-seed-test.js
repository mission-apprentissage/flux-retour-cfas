const assert = require("assert");
const integrationTests = require("../../utils/integrationTests");
const statutsCandidats = require("../../../src/common/components/statutsCandidats");
const users = require("../../../src/common/components/users");
const { clearAll } = require("../../../src/jobs/clear/utils/clearUtils");
const { seedUsers, seedSample } = require("../../../src/jobs/seed/utils/seedUtils");
const { StatutCandidat, User } = require("../../../src/common/model");

integrationTests(__filename, () => {
  it("Vérifie la création de données de test depuis le job", async () => {
    await clearAll();

    const createStatutsCandidats = await statutsCandidats();
    await seedSample(createStatutsCandidats);

    assert.deepStrictEqual((await StatutCandidat.countDocuments({})) > 0, true);
  });

  it("Vérifie la création des users depuis le job", async () => {
    await clearAll();

    const createUsers = await users();
    await seedUsers(createUsers);

    assert.deepStrictEqual((await User.countDocuments({})) > 0, true);
  });
});
