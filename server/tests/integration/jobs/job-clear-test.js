const assert = require("assert").strict;
const { DossierApprenantModel, UserModel } = require("../../../src/common/model");
const { clearDossiersApprenants, clearAll } = require("../../../src/jobs/remove-data/clear/utils/clearUtils");

describe(__filename, () => {
  it("Vérifie la suppression des statuts candidats depuis le job", async () => {
    await clearDossiersApprenants();
    assert.deepEqual((await DossierApprenantModel.countDocuments({})) === 0, true);
  });

  it("Vérifie la suppression de toutes les données depuis le job", async () => {
    await clearAll();
    assert.deepEqual((await DossierApprenantModel.countDocuments({})) === 0, true);
    assert.deepEqual((await UserModel.countDocuments({})) === 0, true);
  });
});
