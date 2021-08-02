const assert = require("assert");
const integrationTests = require("../../utils/integrationTests");
const statutsCandidats = require("../../../src/common/components/statutsCandidats");
const users = require("../../../src/common/components/users");
const { seedUsers, seedSample } = require("../../../src/jobs/seed/utils/seedUtils");
const { StatutCandidat, User } = require("../../../src/common/model");
const { nockGetSiretInfo, nockGetCfdInfo } = require("../../utils/nockApis/nock-tablesCorrespondances");
const { nockGetMetiersByCfd } = require("../../utils/nockApis/nock-Lba");

integrationTests(__filename, () => {
  beforeEach(() => {
    nockGetSiretInfo();
    nockGetCfdInfo();
    nockGetMetiersByCfd();
  });

  it("Vérifie la création de données de test depuis le job", async () => {
    const createStatutsCandidats = await statutsCandidats();
    await seedSample(createStatutsCandidats);

    assert.deepStrictEqual((await StatutCandidat.countDocuments({})) > 0, true);
  });

  it("Vérifie la création des users depuis le job", async () => {
    const createUsers = await users();
    await seedUsers(createUsers);

    assert.deepStrictEqual((await User.countDocuments({})) > 0, true);
  });
});
