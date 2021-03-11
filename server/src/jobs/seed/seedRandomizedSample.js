const { runScript } = require("../scriptWrapper");
const logger = require("../../common/logger");
const { seedRandomizedSample } = require("./utils/seedUtils");
const { jobNames } = require("../../common/model/constants");

runScript(async ({ statutsCandidats }) => {
  logger.info("Seeding data with Randomized sample...");
  await seedRandomizedSample(statutsCandidats);
  logger.info("End seeding data with Randomized sample !");
}, jobNames.seedRandomizedSample);
