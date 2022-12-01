import cliProgress from "cli-progress";
import logger from "../../../../common/logger.js";
import { asyncForEach } from "../../../../common/utils/asyncUtils.js";
import { dossiersApprenantsDb } from "../../../../common/model/collections.js";
import {
  DUPLICATE_COLLECTION_NAMES,
  DUPLICATE_TYPE_CODES,
  getDuplicatesList,
} from "../dossiersApprenants.duplicates.actions.js";
import { getDbCollection } from "../../../../common/mongodb.js";

const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

/**
 * Job de suppression des doublons d'UAIs
 * Récupère les doublons et ne conserve que le plus récent
 */
export const cleanUaisDuplicates = async () => {
  logger.info("Run clean dossiersApprenants with duplicates uais...");

  const resultsCollection = getDbCollection(DUPLICATE_COLLECTION_NAMES.dossiersApprenantsDoublonsUais);
  await resultsCollection.deleteMany({});

  // Identify all uais duplicates
  const uaisDuplicates = await getDuplicatesList(
    DUPLICATE_TYPE_CODES.uai_etablissement.code,
    {},
    { allowDiskUse: true }
  );
  loadingBar.start(uaisDuplicates.length, 0);

  // Find most ancients entry for each duplicate
  await asyncForEach(uaisDuplicates, async (currentDuplicate) => {
    loadingBar.increment();

    // Identify duplicates to remove by slicing the discriminants sorted list
    const duplicatesIdToRemove = currentDuplicate.discriminants.duplicatesCreatedDatesAndIds
      .sort((a, b) => b.created_at - a.created_at)
      .slice(1, currentDuplicate.discriminants.duplicatesCreatedDatesAndIds.length)
      .map((item) => item.id);

    // Delete each ancient duplicates
    await asyncForEach(duplicatesIdToRemove, async (currentIdToRemove) => {
      await dossiersApprenantsDb().deleteOne({ _id: currentIdToRemove });
    });
  });

  loadingBar.stop();
  logger.info("End cleaning DossierApprenant with duplicates uais !");
};
