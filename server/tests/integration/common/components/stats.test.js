import { strict as assert } from 'assert';
import dossiersApprenants from '../../../../src/common/components/dossiersApprenants';
import stats from '../../../../src/common/components/stats';
import { createRandomDossierApprenant } from '../../../data/randomizedSample';

describe(__filename, () => {
  it("Permet de récupérer le nb d'etablissements distincts par uai", async () => {
    // Seed with sample data
    const { addOrUpdateDossiersApprenants } = await dossiersApprenants();
    await addOrUpdateDossiersApprenants([
      createRandomDossierApprenant({ uai_etablissement: "0762232N" }),
      createRandomDossierApprenant({ uai_etablissement: "0762232X" }),
      createRandomDossierApprenant({ uai_etablissement: "0762232Z" }),
    ]);

    // Calcul stats
    const statsModule = await stats();
    const nbStatuts = await statsModule.getNbDistinctCfasByUai();

    // Check stats value
    assert.equal(nbStatuts, 3);
  });
});
