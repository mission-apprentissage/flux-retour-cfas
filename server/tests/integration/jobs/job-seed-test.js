import { strict as assert } from 'assert';
import dossiersApprenants from '../../../src/common/components/dossiersApprenants';
import { dossiersApprenantsDb } from '../../../src/common/model/collections';
import { seedRandomizedSample } from '../../../src/jobs/seed/utils/seedUtils';

describe(__filename, () => {
  it("Vérifie la création de données de test depuis le job", async () => {
    const createDossiersApprenant = await dossiersApprenants();
    await seedRandomizedSample(createDossiersApprenant);

    assert.deepEqual((await dossiersApprenantsDb().countDocuments({})) > 0, true);
  });
});
