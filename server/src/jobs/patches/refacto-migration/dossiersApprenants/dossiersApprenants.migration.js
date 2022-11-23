import cliProgress from "cli-progress";
import { asyncForEach } from "../../../../common/utils/asyncUtils.js";
import logger from "../../../../common/logger.js";
import {
  dossiersApprenantsDb,
  dossiersApprenantsMigrationDb,
  jobEventsDb,
} from "../../../../common/model/collections.js";
import { findOrganismeByUai } from "../../../../common/actions/organismes.actions.js";
import {
  createDossierApprenantMigrationFromDossierApprenant,
  mapToDossiersApprenantsMigrationProps,
} from "./dossiersApprenants.migration.actions.js";

const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

/**
 * Ce script effectue la migration de la collection dossiersApprenants vers la nouvelle collection DossiersApprenantsMigration
 */
export const migrateDossiersApprenantsToDossiersApprenantsMigration = async (sample = 0) => {
  logger.info("Migration des dossiersApprenants vers la collection dossiersApprenantsMigration");

  // Clear
  logger.info(`Suppression des dossiersApprenantsMigration existants...`);
  await dossiersApprenantsMigrationDb().deleteMany();

  // Parse all distinct uais in dossiersApprenants
  let allUaisInDossiers = await dossiersApprenantsDb().distinct("uai_etablissement");
  // Handle sample slicing with option
  if (sample > 0) allUaisInDossiers = allUaisInDossiers.slice(0, sample);

  loadingBar.start(allUaisInDossiers.length, 0);
  let nbDossiersToMigrate = 0;
  let nbDossiersMigratedTotal = 0;
  let nbDossiersNotMigratedTotal = 0;
  let nbUaiMigrated = 0;

  await asyncForEach(allUaisInDossiers, async (currentUai) => {
    try {
      // Récupération des dossiers pour uai courant + migration
      const dossiersForUai = await dossiersApprenantsDb().find({ uai_etablissement: currentUai }).toArray();

      // Migration de la liste des dossiers
      const { nbDossiersMigrated, nbDossiersNotMigrated } = await migrateDossiersApprenantsByUai(
        currentUai,
        dossiersForUai
      );

      // Update count
      nbUaiMigrated++;
      nbDossiersToMigrate += dossiersForUai.length;
      nbDossiersMigratedTotal += nbDossiersMigrated;
      nbDossiersNotMigratedTotal += nbDossiersNotMigrated;
    } catch (error) {
      await jobEventsDb().insertOne({
        jobname: "refacto-migration-dossiersApprenants",
        date: new Date(),
        action: "log-dossierApprenantNotMigrated",
        data: {
          uai: currentUai,
          error,
        },
      });
    }

    loadingBar.increment();
  });

  loadingBar.stop();

  // Log & stats
  logger.info(`-> ${nbUaiMigrated} uais distincts initiaux à traiter dans les dossiersApprenants.`);
  logger.info(`--> ${nbDossiersToMigrate} dossiersApprenants à migrer.`);
  logger.info(`---> ${nbDossiersMigratedTotal} dossiersApprenants migrés.`);
  logger.info(`---> ${nbDossiersNotMigratedTotal} dossiersApprenants non migrés (erreurs).`);
};

/**
 * Migration d'une liste de dossiers d'un uai
 * 1ère étape : on créé l'organisme s'il n'existe pas déja et recupère son _id
 * 2e étape : on create les dossiersApprenantsMigration avec l'_id de l'organisme
 */
const migrateDossiersApprenantsByUai = async (uai, dossiersForUai) => {
  let nbDossiersMigrated = 0;
  let nbDossiersNotMigrated = 0;

  let organisme = await findOrganismeByUai(uai);

  if (!organisme) {
    //TODO ADD organisme + count creation organismes + no else
  } else {
    await asyncForEach(dossiersForUai, async (currentDossierToMigrate) => {
      try {
        // Map des champs pour la migration puis création
        const mappedToDossierApprenantMigration = mapToDossiersApprenantsMigrationProps(currentDossierToMigrate);
        await createDossierApprenantMigrationFromDossierApprenant({
          organisme_id: organisme._id,
          ...mappedToDossierApprenantMigration,
        });
        nbDossiersMigrated++;
      } catch (error) {
        nbDossiersNotMigrated++;
        const { stack: errorStack, message: errorMessage } = error;
        await jobEventsDb().insertOne({
          jobname: "refacto-migration-dossiersApprenants",
          date: new Date(),
          action: "log-dossierApprenantNotMigrated-detail",
          data: {
            dossierApprenant: currentDossierToMigrate,
            error,
            errorStack,
            errorMessage,
          },
        });
      }
    });
  }

  return { nbDossiersMigrated, nbDossiersNotMigrated };
};
