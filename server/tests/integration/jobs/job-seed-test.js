const assert = require("assert").strict;
const statutsCandidats = require("../../../src/common/components/statutsCandidats");
const { seedSample } = require("../../../src/jobs/seed/utils/seedUtils");

const { StatutCandidatModel } = require("../../../src/common/model");

describe(__filename, () => {
  it("Vérifie la création de données de test depuis le job", async () => {
    const createStatutsCandidats = await statutsCandidats();
    await seedSample(createStatutsCandidats);

    assert.deepEqual((await StatutCandidatModel.countDocuments({})) > 0, true);
  });
});
