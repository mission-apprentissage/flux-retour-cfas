const { runScript } = require("../scriptWrapper");
const logger = require("../../common/logger");
const {
  createRandomStatutCandidat,
  createRandomStatutsCandidatsList,
} = require("../../../tests/data/randomizedSample");

runScript(async () => {
  logger.info("Run Tests");
  const randomStatut = createRandomStatutCandidat();
  const randomStatutList = createRandomStatutsCandidatsList(10);
  const randomStatutListWithoutNb = createRandomStatutsCandidatsList();
  logger.info(randomStatut);
  logger.info(randomStatutList.length);
  logger.info(randomStatutListWithoutNb.length);
});
