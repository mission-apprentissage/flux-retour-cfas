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
  let nbDossiersMigrated = 0;
  let nbUaiMigrated = 0;

  await asyncForEach(allUaisInDossiers, async (currentUai) => {
    try {
      // Récupération des dossiers pour uai courant + migration
      const dossiersForUai = await dossiersApprenantsDb().find({ uai_etablissement: currentUai }).toArray();

      // Migration de la liste des dossiers
      await migrateDossiersApprenantsByUai(currentUai, dossiersForUai);

      // Update count
      nbDossiersMigrated += dossiersForUai.length;
      nbUaiMigrated++;
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
  logger.info(`--> ${nbUaiMigrated} uais distincts initiaux dans les dossiersApprenants`);
  logger.info(`--> ${nbDossiersMigrated} dossiers transformés avec succès en organismes`);
  // logger.info(`--> ${cfasNotMigrated.length} cfas non transformés (erreur)`);
  // logger.info(`---> ${cfasUaiErrors.length} cfas non transformés à cause d'un pb de localisation via UAI (erreur)`);
  // logger.info(`---> ${cfasSiretsErrors.length} cfas non transformés à cause d'un pb de sirets (erreur)`);
};

/**
 * Migration d'une liste de dossiers d'un uai
 * 1ère étape : on créé l'organisme s'il n'existe pas déja et recupère son _id
 * 2e étape : on create les dossiersApprenantsMigration avec l'_id de l'organisme
 */
const migrateDossiersApprenantsByUai = async (uai, dossiersForUai) => {
  // TODO
  // logger.info(dossiersForUai.length);
  const organisme = await findOrganismeByUai(uai);

  if (!organisme) {
    //TODO ADD organisme
  } else {
    await asyncForEach(dossiersForUai, async (currentDossierToMigrate) => {
      // TODO create dossier with id
      try {
        // Map des champs pour la migration puis création
        const mappedToDossierApprenantMigration = mapToDossiersApprenantsMigrationProps(currentDossierToMigrate);
        await createDossierApprenantMigrationFromDossierApprenant({
          organisme_id: organisme._id,
          ...mappedToDossierApprenantMigration,
        });
      } catch (error) {
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
};
