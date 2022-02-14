const assert = require("assert").strict;
const statutsCandidats = require("../../../src/common/components/statutsCandidats");
const { seedSample } = require("../../../src/jobs/seed/utils/seedUtils");

const { StatutCandidatModel } = require("../../../src/common/model");
const { nockGetSiretInfo, nockGetCfdInfo } = require("../../utils/nockApis/nock-tablesCorrespondances");
const { nockGetMetiersByCfd } = require("../../utils/nockApis/nock-Lba");

describe(__filename, () => {
  beforeEach(() => {
    nockGetSiretInfo();
    nockGetCfdInfo();
    nockGetMetiersByCfd();
  });

  it("Vérifie la création de données de test depuis le job", async () => {
    const createStatutsCandidats = await statutsCandidats();
    await seedSample(createStatutsCandidats);

    assert.deepEqual((await StatutCandidatModel.countDocuments({})) > 0, true);
  });
});
