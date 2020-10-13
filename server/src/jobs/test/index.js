const { runScript } = require("../scriptWrapper");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const { StatutCandidat } = require("../../common/model");
const { statutsTest, statutsTestUpdate } = require("../../../tests/utils/fixtures");
const { promisify } = require("util");
const logger = require("../../common/logger");

const sleep = promisify(setTimeout);

runScript(async ({ statutsCandidats }) => {
  logger.info("Run Tests");
  await testAdd(statutsCandidats);

  // Checks exists method
  logger.info("...Waiting 4 sec...");
  await sleep(4000);

  const { added, updated } = await statutsCandidats.addOrUpdateStatuts(statutsTestUpdate);
  logger.info(added);
  logger.info(updated);

  logger.info("End tests");
});

const testAdd = async (statutsCandidats) => {
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

  await asyncForEach(statutsTest, async (statutTest) => {
    const exist = await statutsCandidats.getStatut({
      ine_apprenant: statutTest.ine_apprenant,
      id_formation: statutTest.id_formation,
      uai_etablissement: statutTest.uai_etablissement,
    });
    if (exist) {
      logger.info("Found statut" + exist.ine_apprenant);
      logger.info("Found statut" + exist.id_formation);
      logger.info("Found statut" + exist.uai_etablissement);
    }
  });
};
