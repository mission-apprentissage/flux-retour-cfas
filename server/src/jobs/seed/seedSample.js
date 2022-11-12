import { runScript } from "../scriptWrapper.js";
import logger from "../../common/logger.js";
import { seedSample } from "./utils/seedUtils.js";
import { JOB_NAMES } from "../../common/constants/jobsConstants.js";

runScript(async ({ dossiersApprenants }) => {
  logger.info("Seeding data with Sample...");
  await seedSample(dossiersApprenants);
  logger.info("End seeding data with Sample !");
}, JOB_NAMES.seedSample);
