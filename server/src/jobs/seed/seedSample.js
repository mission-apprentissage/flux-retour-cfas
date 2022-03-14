const { runScript } = require("../scriptWrapper");
const logger = require("../../common/logger");
const { seedSample } = require("./utils/seedUtils");
const { jobNames } = require("../../common/constants/jobsConstants");

runScript(async ({ dossiersApprenants }) => {
  logger.info("Seeding data with Sample...");
  await seedSample(dossiersApprenants);
  logger.info("End seeding data with Sample !");
}, jobNames.seedSample);
