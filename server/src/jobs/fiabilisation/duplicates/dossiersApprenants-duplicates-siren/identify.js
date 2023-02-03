import cliProgress from "cli-progress";
import logger from "../../../../common/logger.js";
import { DUPLICATE_TYPE_CODES, getDuplicatesList } from "../dossiersApprenants.duplicates.actions.js";

const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

/**
 * Job d'identification des doublons de SIRENs
 * Construit une collection dossiersApprenantsDoublonsSiren contenant les doublons
 */
export const identifySirenDuplicates = async () => {
  logger.info("Run identification dossiersApprenants with duplicates siren...");

  // Identify all duplicates
  const duplicates = await getDuplicatesList(DUPLICATE_TYPE_CODES.siren.code, {}, { allowDiskUse: true });
  loadingBar.start(duplicates.length, 0);

  // FIXME non testé

  loadingBar.stop();
  logger.info("End identification DossierApprenant with duplicates siren !");
};
