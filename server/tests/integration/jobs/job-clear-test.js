const assert = require("assert").strict;
const integrationTests = require("../../utils/integrationTests");
const { StatutCandidat, User } = require("../../../src/common/model");
const { clearStatutsCandidats, clearAll } = require("../../../src/jobs/clear/utils/clearUtils");

integrationTests(__filename, () => {
  it("Vérifie la suppression des statuts candidats depuis le job", async () => {
    await clearStatutsCandidats();
    assert.deepEqual((await StatutCandidat.countDocuments({})) === 0, true);
  });

  it("Vérifie la suppression de toutes les données depuis le job", async () => {
    await clearAll();
    assert.deepEqual((await StatutCandidat.countDocuments({})) === 0, true);
    assert.deepEqual((await User.countDocuments({})) === 0, true);
  });
});
