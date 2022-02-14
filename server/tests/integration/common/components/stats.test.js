const assert = require("assert").strict;
const statutsCandidats = require("../../../../src/common/components/statutsCandidats");
const stats = require("../../../../src/common/components/stats");
const { nockGetSiretInfo, nockGetCfdInfo } = require("../../../utils/nockApis/nock-tablesCorrespondances");
const { createRandomStatutCandidat } = require("../../../data/randomizedSample");
const { nockGetMetiersByCfd } = require("../../../utils/nockApis/nock-Lba");

describe(__filename, () => {
  beforeEach(() => {
    nockGetSiretInfo();
    nockGetCfdInfo();
    nockGetMetiersByCfd();
  });

  it("Permet de récupérer le nb d'etablissements distincts par uai", async () => {
    // Seed with sample data
    const { addOrUpdateStatuts } = await statutsCandidats();
    await addOrUpdateStatuts([
      createRandomStatutCandidat({ uai_etablissement: "0762232N" }),
      createRandomStatutCandidat({ uai_etablissement: "0762232X" }),
      createRandomStatutCandidat({ uai_etablissement: "0762232Z" }),
    ]);

    // Calcul stats
    const statsModule = await stats();
    const nbStatuts = await statsModule.getNbDistinctCfasByUai();

    // Check stats value
    assert.equal(nbStatuts, 3);
  });

  it("Permet de récupérer le nb d'etablissements distincts par siret", async () => {
    // Seed with sample data
    const { addOrUpdateStatuts } = await statutsCandidats();
    await addOrUpdateStatuts([
      createRandomStatutCandidat({ siret_etablissement: "80070060000010" }),
      createRandomStatutCandidat({ siret_etablissement: "80070060000011" }),
      createRandomStatutCandidat({ siret_etablissement: "80070060000011" }),
      createRandomStatutCandidat({ siret_etablissement: "80070060000012" }),
      createRandomStatutCandidat({ siret_etablissement: "80070060000012" }),
      createRandomStatutCandidat({ siret_etablissement: "80070060000012" }),
      createRandomStatutCandidat({ siret_etablissement: "80070060000012" }),
    ]);

    // Calcul stats
    const statsModule = await stats();
    const nbCfas = await statsModule.getNbDistinctCfasBySiret();

    // Check stats value
    assert.equal(nbCfas, 3);
  });
});
