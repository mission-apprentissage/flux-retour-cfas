import { validateAnneeScolaire } from "../../../common/utils/validationsUtils/anneeScolaire.js";
import logger from "../../../common/logger.js";
import { dossiersApprenantsMigrationDb } from "../../../common/model/collections.js";

/**
 * Fonction d'archivage des anciens dossiers apprenants
 * @param {*} archiveDossiersApprenants
 * @param {*} ANNEE_SCOLAIRE_START_LIMIT
 */
export const hydrateArchivesDossiersApprenants = async (
  archiveDossiersApprenants,
  ANNEE_SCOLAIRE_START_LIMIT = 2021
) => {
  logger.info(
    `Archivage des dossiers apprenants avec année scolaire nulle ou antérieure à ${ANNEE_SCOLAIRE_START_LIMIT}`
  );
  const allAnneesScolaires = await dossiersApprenantsMigrationDb().distinct("annee_scolaire");
  const anneeScolaireBlacklistValues = allAnneesScolaires.filter((anneeScolaire) => {
    if (validateAnneeScolaire(anneeScolaire).error) return true;

    const anneeScolaireStart = anneeScolaire.split("-")[0];
    if (Number(anneeScolaireStart) < ANNEE_SCOLAIRE_START_LIMIT) return true;

    return false;
  });

  logger.info(
    "Années scolaire trouvées null ou antérieures à 2021:",
    anneeScolaireBlacklistValues.map(String).join(", ")
  );

  const query = { annee_scolaire: { $in: anneeScolaireBlacklistValues } };

  const count = await dossiersApprenantsMigrationDb().countDocuments(query);
  logger.info(count, "dossiers apprenants seront archivés");

  const cursor = dossiersApprenantsMigrationDb().find(query);
  while (await cursor.hasNext()) {
    const dossierApprenantToArchive = await cursor.next();

    try {
      await archiveDossiersApprenants.create(dossierApprenantToArchive);
      await dossiersApprenantsMigrationDb().deleteOne({ _id: dossierApprenantToArchive._id });
    } catch (err) {
      logger.error("Could not archive dossier apprenant with _id", dossierApprenantToArchive._id);
    }
  }
};
