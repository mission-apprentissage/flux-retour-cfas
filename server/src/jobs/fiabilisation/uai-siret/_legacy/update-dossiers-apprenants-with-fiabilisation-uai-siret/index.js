import logger from "../../../../../common/logger.js";
import { dossiersApprenantsDb, fiabilisationUaiSiretDb } from "../../../../../common/model/collections.js";
import { asyncForEach } from "../../../../../common/utils/asyncUtils.js";

const filters = {
  annee_scolaire: { $in: ["2022-2022", "2022-2023", "2023-2023"] },
};

/**
 * Méthode de maj des dossiersApprenants pour prise en compte de la fiabilisation UAI SIRET
 */
export const updateDossiersApprenantWithFiabilisationUaiSiret = async () => {
  const allCouplesToMakeFiable = await fiabilisationUaiSiretDb().find().toArray();

  let dossiersApprenantModifiedCount = 0;
  await asyncForEach(allCouplesToMakeFiable, async (fiabilisationMapping) => {
    try {
      const { modifiedCount } = await dossiersApprenantsDb().updateMany(
        { ...filters, uai_etablissement: fiabilisationMapping.uai, siret_etablissement: fiabilisationMapping.siret },
        {
          $set: {
            uai_etablissement: fiabilisationMapping.uai_fiable,
            siret_etablissement: fiabilisationMapping.siret_fiable,
          },
        }
      );
      dossiersApprenantModifiedCount += modifiedCount;
    } catch (err) {
      logger.error(err);
    }
  });
  logger.info(dossiersApprenantModifiedCount, "dossiers apprenants mis à jour");
};
