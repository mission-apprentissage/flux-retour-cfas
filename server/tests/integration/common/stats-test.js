const assert = require("assert");
const integrationTests = require("../../utils/integrationTests");
const statutsCandidats = require("../../../src/common/components/statutsCandidats");
const stats = require("../../../src/common/components/stats");
const { seedSample } = require("../../../src/jobs/seed/utils/seedUtils");

integrationTests(__filename, () => {
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

    assert.strictEqual(allStats.nbCandidatsMultiUais > 0, true);
    assert.strictEqual(allStats.nbCandidatsMultiCfds > 0, true);

    assert.strictEqual(allStats.nbDistinctCandidatsTotal > 0, true);
    assert.strictEqual(allStats.nbDistinctCandidatsWithIne > 0, true);
    assert.strictEqual(allStats.nbDistinctCandidatsWithoutIne > 0, true);
    assert.strictEqual(allStats.nbStatutsSansIne > 0, true);
    assert.strictEqual(allStats.nbDistinctCandidatsWithChangingStatutProspectInscrit > 0, true);
    assert.strictEqual(allStats.nbDistinctCandidatsWithChangingStatutProspectApprenti > 0, true);
    assert.strictEqual(allStats.nbDistinctCandidatsWithChangingStatutProspectAbandon === 0, true);

    assert.strictEqual(allStats.nbCfas > 0, true);
  });
});
