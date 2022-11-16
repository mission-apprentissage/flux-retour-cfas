import { runScript } from "../scriptWrapper.js";
import logger from "../../common/logger.js";
import { seedRandomizedSample } from "./utils/seedUtils.js";
import { JOB_NAMES } from "../../common/constants/jobsConstants.js";

runScript(async ({ dossiersApprenants }) => {
  logger.info("Seeding data with Randomized sample...");
  await seedRandomizedSample(dossiersApprenants);
  logger.info("End seeding data with Randomized sample !");
}, JOB_NAMES.seedRandomizedSample);
