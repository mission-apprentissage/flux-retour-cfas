const assert = require("assert").strict;
const dossiersApprenants = require("../../../src/common/components/dossiersApprenants");
const { seedRandomizedSample } = require("../../../src/jobs/seed/utils/seedUtils");

const { DossierApprenantModel } = require("../../../src/common/model");

describe(__filename, () => {
  it("Vérifie la création de données de test depuis le job", async () => {
    const createDossiersApprenant = await dossiersApprenants();
    await seedRandomizedSample(createDossiersApprenant);

    assert.deepEqual((await DossierApprenantModel.countDocuments({})) > 0, true);
  });
});
