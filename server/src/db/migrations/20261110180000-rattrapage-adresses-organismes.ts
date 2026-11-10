import { addJob } from "job-processor";

import logger from "@/common/logger";

export const up = async () => {
  await addJob({ name: "tmp:rattrapage-adresses-organismes", queued: true });
  logger.info("[Migration] rattrapage des adresses des organismes mis en file");
};
