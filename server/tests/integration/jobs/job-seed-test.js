const assert = require("assert").strict;
const dossiersApprenants = require("../../../src/common/components/dossiersApprenants");
const { dossiersApprenantsDb } = require("../../../src/common/model/collections");
const { seedRandomizedSample } = require("../../../src/jobs/seed/utils/seedUtils");

describe(__filename, () => {
  it("Vérifie la création de données de test depuis le job", async () => {
    const createDossiersApprenant = await dossiersApprenants();
    await seedRandomizedSample(createDossiersApprenant);

    assert.deepEqual((await dossiersApprenantsDb().countDocuments({})) > 0, true);
  });
});
