const { runScript } = require("../scriptWrapper");
const logger = require("../../common/logger");
const { seedSample } = require("./utils/seedUtils");
const { JOB_NAMES } = require("../../common/constants/jobsConstants");

runScript(async ({ dossiersApprenants }) => {
  logger.info("Seeding data with Sample...");
  await seedSample(dossiersApprenants);
  logger.info("End seeding data with Sample !");
}, JOB_NAMES.seedSample);
