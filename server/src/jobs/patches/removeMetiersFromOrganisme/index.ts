import logger from "@/common/logger";
import { organismesDb } from "@/common/model/collections";

export const removeMetiersFromOrganisme = async () => {
  logger.info(`Suppression de metiers dans organismes`);
  await organismesDb().updateMany({}, { $unset: { metiers: "" } });
  logger.info(`Fin - Suppression de metiers dans organismes`);
};
