import { validateAnneeScolaire } from "../../../common/utils/validationsUtils/anneeScolaire.js";
import logger from "../../../common/logger.js";
import { dossiersApprenantsMigrationDb, effectifsApprenantsDb } from "../../../common/model/collections.js";
import { updateDossierApprenant } from "../../../common/actions/dossiersApprenants.actions.js";
import { updateEffectif } from "../../../common/actions/effectifs.actions.js";

/**
 * Fonction principale d'archivage des dossiersApprenants et des effectifs
 * @param {*} ANNEE_SCOLAIRE_START_LIMIT
 */
export const hydrateArchivesDossiersApprenantsAndEffectifs = async (ANNEE_SCOLAIRE_START_LIMIT = 2021) => {
  await hydrateArchivesDossiersApprenants(ANNEE_SCOLAIRE_START_LIMIT);
  await hydrateArchivesEffectifs(ANNEE_SCOLAIRE_START_LIMIT);
};

/**
 * Fonction d'archivage des anciens dossiers apprenants
 * @param {*} ANNEE_SCOLAIRE_START_LIMIT
 */
const hydrateArchivesDossiersApprenants = async (ANNEE_SCOLAIRE_START_LIMIT = 2021) => {
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
      await updateDossierApprenant(dossierApprenantToArchive._id, { ...dossierApprenantToArchive, archive: true });
    } catch (err) {
      logger.error("Could not archive dossier apprenant with _id", dossierApprenantToArchive._id);
    }
  }
};

/**
 * Fonction d'archivage des anciens effectifs
 * TODO Keep only this job & remove other when effectif will replace dossierApprenant model
 * @param {*} ANNEE_SCOLAIRE_START_LIMIT
 */
const hydrateArchivesEffectifs = async (ANNEE_SCOLAIRE_START_LIMIT = 2021) => {
  logger.info(`Archivage des effectifs avec année scolaire nulle ou antérieure à ${ANNEE_SCOLAIRE_START_LIMIT}`);
  const allAnneesScolaires = await effectifsApprenantsDb().distinct("annee_scolaire");
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

  const count = await effectifsApprenantsDb().countDocuments(query);
  logger.info(count, "effectifs seront archivés");

  const cursor = effectifsApprenantsDb().find(query);
  while (await cursor.hasNext()) {
    const toArchive = await cursor.next();

    try {
      await updateEffectif(toArchive._id, { ...toArchive, archive: true });
    } catch (err) {
      logger.error("Could not archive effectif with _id", toArchive._id);
    }
  }
};
