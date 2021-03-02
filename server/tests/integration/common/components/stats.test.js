const assert = require("assert");
const integrationTests = require("../../../utils/integrationTests");
const statutsCandidats = require("../../../../src/common/components/statutsCandidats");
const { codesStatutsCandidats } = require("../../../../src/common/model/constants");
const stats = require("../../../../src/common/components/stats");
const { seedSample, seedRandomizedSampleWithStatut } = require("../../../../src/jobs/seed/utils/seedUtils");
const { simpleStatutsWith3DifferentUais, simpleStatutsWith3DifferentSirets } = require("../../../data/sample");
const { nockGetSiretInfo, nockGetCfdInfo } = require("../../../utils/nockApis/nock-tablesCorrespondances");

integrationTests(__filename, () => {
  beforeEach(() => {
    nockGetSiretInfo();
    nockGetCfdInfo();
  });

  it("Permet de récupérer les statistiques", async () => {
    // Seed with sample data
    const createStatutsCandidats = await statutsCandidats();
    await seedSample(createStatutsCandidats);

    // Calcul stats
    const statsModule = await stats();
    const allStats = await statsModule.getAllStats();

    // Check stats existence
    assert.strictEqual(allStats.nbStatutsCandidats > 0, true);
    assert.strictEqual(allStats.nbStatutsProspect > 0, true);
    assert.strictEqual(allStats.nbStatutsInscrits > 0, true);
    assert.strictEqual(allStats.nbStatutsApprentis > 0, true);
    assert.strictEqual(allStats.nbStatutsAbandon > 0, true);
    assert.strictEqual(allStats.nbStatutsSansIne > 0, true);
    assert.strictEqual(allStats.nbDistinctCandidatsWithoutIne > 0, true);
    assert.strictEqual(allStats.nbDistinctCandidatsWithIne > 0, true);

    assert.strictEqual(allStats.nbCandidatsMultiUaisWithIne > 0, true);
    assert.strictEqual(allStats.nbCandidatsMultiUaisWithoutIne > 0, true);
    assert.strictEqual(allStats.nbCandidatsMultiCfdsWithIne > 0, true);
    assert.strictEqual(allStats.nbCandidatsMultiCfdsWithoutIne > 0, true);

    assert.strictEqual(allStats.nbDistinctCandidatsTotal > 0, true);
    assert.strictEqual(allStats.nbDistinctCandidatsWithIne > 0, true);
    assert.strictEqual(allStats.nbDistinctCandidatsWithoutIne > 0, true);
    assert.strictEqual(allStats.nbStatutsSansIne > 0, true);
    assert.strictEqual(allStats.nbDistinctCandidatsWithChangingStatutProspectInscrit > 0, true);
    assert.strictEqual(allStats.nbDistinctCandidatsWithChangingStatutProspectApprenti > 0, true);
    assert.strictEqual(allStats.nbDistinctCandidatsWithChangingStatutProspectAbandon === 0, true);

    assert.strictEqual(allStats.nbCfasDistinctUai > 0, true);
    assert.strictEqual(allStats.nbCfasDistinctSiret > 0, true);
  });

  it("Permet de récupérer le nb de statuts prospect", async () => {
    // Seed with sample data for value prospect
    const nbStatutsForTest = 10;
    const createStatutsCandidats = await statutsCandidats();
    await seedRandomizedSampleWithStatut(createStatutsCandidats, nbStatutsForTest, codesStatutsCandidats.prospect);

    // Calcul stats
    const statsModule = await stats();
    const nbStatuts = await statsModule.getNbStatutsProspect();

    // Check stats value
    assert.strictEqual(nbStatuts, nbStatutsForTest);
  });

  it("Permet de récupérer le nb de statuts inscrit", async () => {
    // Seed with sample data for value inscrit
    const nbStatutsForTest = 10;
    const createStatutsCandidats = await statutsCandidats();
    await seedRandomizedSampleWithStatut(createStatutsCandidats, nbStatutsForTest, codesStatutsCandidats.inscrit);

    // Calcul stats
    const statsModule = await stats();
    const nbStatuts = await statsModule.getNbStatutsInscrit();

    // Check stats value
    assert.strictEqual(nbStatuts, nbStatutsForTest);
  });

  it("Permet de récupérer le nb de statuts apprenti", async () => {
    // Seed with sample data for value apprenti
    const nbStatutsForTest = 10;
    const createStatutsCandidats = await statutsCandidats();
    await seedRandomizedSampleWithStatut(createStatutsCandidats, nbStatutsForTest, codesStatutsCandidats.apprenti);

    // Calcul stats
    const statsModule = await stats();
    const nbStatuts = await statsModule.getNbStatutsApprenti();

    // Check stats value
    assert.strictEqual(nbStatuts, nbStatutsForTest);
  });

  it("Permet de récupérer le nb de statuts abandon", async () => {
    // Seed with sample data for value abandon
    const nbStatutsForTest = 10;
    const createStatutsCandidats = await statutsCandidats();
    await seedRandomizedSampleWithStatut(createStatutsCandidats, nbStatutsForTest, codesStatutsCandidats.abandon);

    // Calcul stats
    const statsModule = await stats();
    const nbStatuts = await statsModule.getNbStatutsAbandon();

    // Check stats value
    assert.strictEqual(nbStatuts, nbStatutsForTest);
  });

  it("Permet de récupérer le nb d'etablissements distincts par uai", async () => {
    // Seed with sample data
    const { addOrUpdateStatuts } = await statutsCandidats();
    await addOrUpdateStatuts(simpleStatutsWith3DifferentUais);

    // Calcul stats
    const statsModule = await stats();
    const nbStatuts = await statsModule.getNbDistinctCfasByUai();

    // Check stats value
    assert.strictEqual(nbStatuts, 3);
  });

  it("Permet de récupérer le nb d'etablissements distincts par siret", async () => {
    // Seed with sample data
    const { addOrUpdateStatuts } = await statutsCandidats();
    await addOrUpdateStatuts(simpleStatutsWith3DifferentSirets);

    // Calcul stats
    const statsModule = await stats();
    const nbStatuts = await statsModule.getNbDistinctCfasBySiret();

    // Check stats value
    assert.strictEqual(nbStatuts, 3);
  });
});
