import { PromisePool } from "@supercharge/promise-pool/dist/promise-pool.js";
import { fiabilisationUaiSiretDb } from "../../../common/model/collections.js";
import { FIABILISATION_MAPPINGS as manualMapping } from "./mapping.js";

/**
 * Insertion des mapping manuels depuis fichier
 * @returns
 */
export const insertManualMappingsFromFile = async () => {
  let nbInserted = 0;

  await PromisePool.for(manualMapping).process(async (mapping) => {
    await fiabilisationUaiSiretDb().updateOne(
      { uai: mapping.uai, siret: mapping.siret },
      { $set: mapping },
      { upsert: true }
    );
    nbInserted++;
  });

  return nbInserted;
};
