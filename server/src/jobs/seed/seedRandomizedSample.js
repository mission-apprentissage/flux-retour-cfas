const { runScript } = require("../scriptWrapper");
const logger = require("../../common/logger");
const { seedRandomizedSample } = require("./utils/seedUtils");
const { JOB_NAMES } = require("../../common/constants/jobsConstants");

runScript(async ({ dossiersApprenants }) => {
  logger.info("Seeding data with Randomized sample...");
  await seedRandomizedSample(dossiersApprenants);
  logger.info("End seeding data with Randomized sample !");
}, JOB_NAMES.seedRandomizedSample);
