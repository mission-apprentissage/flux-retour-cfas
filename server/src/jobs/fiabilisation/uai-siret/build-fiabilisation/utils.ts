import { fiabilisationUaiSiretDb } from "../../../../common/model/collections.js";
import { asyncForEach } from "../../../../common/utils/asyncUtils.js";
import { FIABILISATION_MAPPINGS as manualMapping } from "../mapping.js";

/**
 * Méthode d'ajout à la collection fiabilisation si non existant
 * @param {*} fiabilisation
 * @returns
 */
export const insertInFiabilisationIfNotExist = async (fiabilisation) => {
  const coupleFromDb = await fiabilisationUaiSiretDb().findOne({
    uai: fiabilisation.uai,
    siret: fiabilisation.siret,
    type: fiabilisation.type,
  });
  if (coupleFromDb) return;
  return await fiabilisationUaiSiretDb().insertOne({ created_at: new Date(), ...fiabilisation });
};

/**
 * Insertion des mapping manuels depuis fichier
 * @returns
 */
export const insertManualMappingsFromFile = async () => {
  let nbInserted = 0;

  await asyncForEach(manualMapping, async (mapping) => {
    await fiabilisationUaiSiretDb().updateOne(
      { uai: mapping.uai, siret: mapping.siret },
      { $set: mapping },
      { upsert: true }
    );
    nbInserted++;
  });

  return nbInserted;
};
