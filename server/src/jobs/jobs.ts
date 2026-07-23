import { initJobProcessor } from "job-processor";

import logger from "@/common/logger";
import { getDatabase } from "@/common/mongodb";
import config from "@/config";

import { crons, jobs } from "./registry";

export async function setupJobProcessor() {
  return initJobProcessor({
    db: getDatabase(),
    logger,
    crons: config.env === "preview" || config.env === "local" ? {} : crons,
    jobs,
  });
}
