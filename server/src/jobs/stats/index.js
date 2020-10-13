const { runScript } = require("../scriptWrapper");
const logger = require("../../common/logger");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const { statutsTest } = require("../../../tests/utils/fixtures");
const { StatutCandidat } = require("../../common/model");
// const { codesStatutsCandidats } = require("../../common/model/constants");

runScript(async ({ stats, statutsCandidats }) => {
  logger.info("Running stats...");

  // Test add
  await addSimpleStatut(statutsCandidats);

  // Load stats
  const statsNbStatutCandidat = await stats.getNbStatutCandidatsTotal();
  // const nbStatutProspect = await stats.getNbStatutCandidats(codesStatutsCandidats.prospect);
  // const nbStatutInscrit = await stats.getNbStatutCandidats(codesStatutsCandidats.inscrit);
  // const nbStatutApprenti = await stats.getNbStatutCandidats(codesStatutsCandidats.apprenti);
  // const nbStatutAbandon = await stats.getNbStatutCandidats(codesStatutsCandidats.abandon);
  // const nbUaiStatutProspect = await stats.getNbStatutCandidats(codesStatutsCandidats.prospect);
  // const nbUaiStatutInscrit = await stats.getNbStatutCandidats(codesStatutsCandidats.inscrit);
  // const nbUaiStatutApprenti = await stats.getNbStatutCandidats(codesStatutsCandidats.apprenti);
  // const nbUaiStatutAbandon = await stats.getNbStatutsCandidatsNbUais(codesStatutsCandidats.abandon);

  logger.info(statsNbStatutCandidat);
});

const addSimpleStatut = async (statutsCandidats) => {
  // Add statuts test
  await asyncForEach(statutsTest, async (statutTest) => {
    const toAdd = new StatutCandidat(statutTest);
    const exist = await statutsCandidats.existsStatut({
      ine_apprenant: toAdd.ine_apprenant,
      id_formation: toAdd.id_formation,
      uai_etablissement: toAdd.uai_etablissement,
    });
    if (!exist) {
      await toAdd.save();
    }
  });
};
