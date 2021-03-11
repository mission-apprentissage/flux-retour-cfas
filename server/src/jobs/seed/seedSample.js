const { runScript } = require("../scriptWrapper");
const logger = require("../../common/logger");
const { seedSample } = require("./utils/seedUtils");
const { jobNames } = require("../../common/model/constants");

runScript(async ({ statutsCandidats }) => {
  logger.info("Seeding data with Sample...");
  await seedSample(statutsCandidats);
  logger.info("End seeding data with Sample !");
}, jobNames.seedSample);
