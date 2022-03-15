const { runScript } = require("../scriptWrapper");
const logger = require("../../common/logger");
const { seedRandomizedSample } = require("./utils/seedUtils");
const { jobNames } = require("../../common/constants/jobsConstants");

runScript(async ({ dossiersApprenants }) => {
  logger.info("Seeding data with Randomized sample...");
  await seedRandomizedSample(dossiersApprenants);
  logger.info("End seeding data with Randomized sample !");
}, jobNames.seedRandomizedSample);
