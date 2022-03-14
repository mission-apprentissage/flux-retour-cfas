const assert = require("assert").strict;
const dossiersApprenants = require("../../../../src/common/components/dossiersApprenants");
const stats = require("../../../../src/common/components/stats");
const { createRandomDossierApprenant } = require("../../../data/randomizedSample");

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

  it("Permet de récupérer le nb d'etablissements distincts par siret", async () => {
    // Seed with sample data
    const { addOrUpdateDossiersApprenants } = await dossiersApprenants();
    await addOrUpdateDossiersApprenants([
      createRandomDossierApprenant({ siret_etablissement: "80070060000010" }),
      createRandomDossierApprenant({ siret_etablissement: "80070060000011" }),
      createRandomDossierApprenant({ siret_etablissement: "80070060000011" }),
      createRandomDossierApprenant({ siret_etablissement: "80070060000012" }),
      createRandomDossierApprenant({ siret_etablissement: "80070060000012" }),
      createRandomDossierApprenant({ siret_etablissement: "80070060000012" }),
      createRandomDossierApprenant({ siret_etablissement: "80070060000012" }),
    ]);

    // Calcul stats
    const statsModule = await stats();
    const nbCfas = await statsModule.getNbDistinctCfasBySiret();

    // Check stats value
    assert.equal(nbCfas, 3);
  });
});
