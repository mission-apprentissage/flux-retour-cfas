const assert = require("assert").strict;
const integrationTests = require("../../utils/integrationTests");
const statutsCandidats = require("../../../src/common/components/statutsCandidats");
const { seedSample } = require("../../../src/jobs/seed/utils/seedUtils");

const { StatutCandidat } = require("../../../src/common/model");
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

    assert.deepEqual((await StatutCandidat.countDocuments({})) > 0, true);
  });
});
