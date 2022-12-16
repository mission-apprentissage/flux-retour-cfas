import cliProgress from "cli-progress";
import { asyncForEach } from "../../../../common/utils/asyncUtils.js";
import logger from "../../../../common/logger.js";
import {
  dossiersApprenantsDb,
  dossiersApprenantsMigrationDb,
  effectifsDb,
} from "../../../../common/model/collections.js";
import { createOrganisme, findOrganismeByUai } from "../../../../common/actions/organismes.actions.js";
import { buildAdresseFromUai } from "../../../../common/utils/uaiUtils.js";
import { createJobEvent } from "../../../../common/actions/jobEvents.actions.js";
import {
  createDossierApprenantMigrationFromDossierApprenant,
  createEffectifFromDossierApprenantMigrated,
  mapToDossiersApprenantsMigrationProps,
} from "../../../../common/actions/dossiersApprenants.migration.actions.js";

const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

// Const for jobEvents analysis
const JOBNAME = "refacto-migration-dossiersApprenants";
const LOG_ACTIONS = {
  DOSSIERS: {
    NOT_MIGRATED: "log-dossierApprenantNotMigrated",
    NOT_MIGRATED_DETAIL: "log-dossierApprenantNotMigrated-detail",
  },
  ORGANISME: {
    CREATED: "log-dossierApprenantMigration-organismeCreated",
    CREATION_ERROR: "log-dossierApprenantMigration-organismeCreated-error",
  },
};

/**
 * Ce script effectue la migration de la collection dossiersApprenants vers la nouvelle collection DossiersApprenantsMigration
 */
export const migrateDossiersApprenantsToDossiersApprenantsMigration = async (
  sample = 0,
  uai = null,
  numRegion = null,
  numAcademie = null
) => {
  // Clear
  logger.info(`Suppression des dossiersApprenantsMigration et effectifs existants...`);
  await dossiersApprenantsMigrationDb().deleteMany();
  await effectifsDb().deleteMany();

  logger.info("Migration des dossiersApprenants vers la collection dossiersApprenantsMigration");

  // Parse all distinct uais in dossiersApprenants
  let allUaisInDossiers = await dossiersApprenantsDb().distinct("uai_etablissement");

  // Handle options
  if (numRegion) {
    allUaisInDossiers = await dossiersApprenantsDb().distinct("uai_etablissement", {
      etablissement_num_region: numRegion,
    });
    logger.info(`Migration des dossiersApprenants de la région ${numRegion}`);
  }

  if (numAcademie) {
    allUaisInDossiers = await dossiersApprenantsDb().distinct("uai_etablissement", {
      etablissement_num_academie: numAcademie,
    });
    logger.info(`Migration des dossiersApprenants de l'academie ${numAcademie}`);
  }

  if (sample > 0) {
    allUaisInDossiers = allUaisInDossiers.slice(0, sample);
    logger.info(`Migration des dossiersApprenants des ${sample} premiers organismes`);
  }

  if (uai) {
    allUaisInDossiers = [uai];
    logger.info(`Migration des dossiersApprenants de l'organisme ${uai}`);
  }

  loadingBar.start(allUaisInDossiers.length, 0);
  let nbDossiersToMigrate = 0;
  let nbDossiersMigratedTotal = 0;
  let nbEffectifsCreatedTotal = 0;
  let nbDossiersNotMigratedTotal = 0;
  let nbOrganismeExistantTotal = 0;
  let nbOrganismeCreatedTotal = 0;
  let nbOrganismeCreatedErrorsTotal = 0;
  let nbUaiHandled = 0;

  await asyncForEach(allUaisInDossiers, async (currentUai) => {
    try {
      // Récupération des dossiers pour uai courant + migration
      const dossiersForUai = await dossiersApprenantsDb().find({ uai_etablissement: currentUai }).toArray();

      // Migration de la liste des dossiers
      const { nbEffectifsCreated, nbDossiers, nbOrganismes } = await migrateDossiersApprenantsByUai(
        currentUai,
        dossiersForUai
      );

      // Update count
      nbUaiHandled++;
      nbDossiersToMigrate += dossiersForUai.length;
      nbDossiersMigratedTotal += nbDossiers.migrated;
      nbEffectifsCreatedTotal += nbEffectifsCreated;
      nbDossiersNotMigratedTotal += nbDossiers.notMigrated;
      nbOrganismeExistantTotal += nbOrganismes.existant;
      nbOrganismeCreatedTotal += nbOrganismes.created;
      nbOrganismeCreatedErrorsTotal += nbOrganismes.notCreated;
    } catch (error) {
      await createJobEvent({
        jobname: JOBNAME,
        date: new Date(),
        action: LOG_ACTIONS.DOSSIERS.NOT_MIGRATED,
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
  logger.info(`-> ${nbUaiHandled} uais distincts initiaux traités dans les dossiersApprenants.`);
  logger.info(`-> ${nbDossiersToMigrate} dossiersApprenants à migrer.`);

  logger.info(`--> ${nbDossiersMigratedTotal} dossiersApprenants migrés.`);
  logger.info(`--> ${nbDossiersNotMigratedTotal} dossiersApprenants non migrés (erreurs).`);
  logger.info(`--> ${nbEffectifsCreatedTotal} effectifs créés.`);

  logger.info(`---> ${nbOrganismeExistantTotal} organismes déja existants.`);
  logger.info(`---> ${nbOrganismeCreatedTotal} organismes crées.`);
  logger.info(`---> ${nbOrganismeCreatedErrorsTotal} organismes non créées à cause d'erreurs.`);
};

/**
 * Migration d'une liste de dossiers d'un uai
 * On cherche l'organisme, s'il existe on migre tous ses dossiers
 * s'il n'existe pas on le créé et ensuite on migre ses dossiers
 */
const migrateDossiersApprenantsByUai = async (uai, dossiersForUai) => {
  let nbDossiersMigrated = 0;
  let nbEffectifsCreated = 0;
  let nbDossiersNotMigrated = 0;
  let nbOrganismeExistant = 0;
  let nbOrganismeCreated = 0;
  let nbOrganismeCreatedErrors = 0;

  let organisme = await findOrganismeByUai(uai);

  // Si organisme non trouvé on le créé
  if (!organisme) {
    try {
      organisme = await createOrganisme({
        uai,
        ...buildAdresseFromUai(uai),
        nom: dossiersForUai[0]?.nom_etablissement ?? "", // On prends le premier nom fourni dans le dossier - voir si gestion différente
      });

      nbOrganismeCreated++;

      // Store log organisme création
      await createJobEvent({
        jobname: JOBNAME,
        date: new Date(),
        action: LOG_ACTIONS.ORGANISME.CREATED,
        data: { organisme },
      });
    } catch (error) {
      nbOrganismeCreatedErrors++;
      // Store log error organisme création
      await createJobEvent({
        jobname: JOBNAME,
        date: new Date(),
        action: LOG_ACTIONS.ORGANISME.CREATION_ERROR,
        data: { error, uai },
      });
    }
  } else {
    nbOrganismeExistant++;
  }

  // Si organisme trouvé ou création OK
  if (organisme) {
    await asyncForEach(dossiersForUai, async (currentDossierToMigrate) => {
      try {
        // Map des champs pour la migration puis création du dossier
        const mappedToDossierApprenantMigration = mapToDossiersApprenantsMigrationProps(currentDossierToMigrate);
        const dossierApprenantCreated = await createDossierApprenantMigrationFromDossierApprenant({
          organisme_id: organisme._id,
          ...mappedToDossierApprenantMigration,
        });
        // Création de l'effectif lié au dossier
        await createEffectifFromDossierApprenantMigrated(dossierApprenantCreated);
        nbDossiersMigrated++;
        nbEffectifsCreated++;
      } catch (error) {
        nbDossiersNotMigrated++;

        // Store log error + détail
        const { stack: errorStack, message: errorMessage } = error;
        await createJobEvent({
          jobname: JOBNAME,
          date: new Date(),
          action: LOG_ACTIONS.DOSSIERS.NOT_MIGRATED_DETAIL,
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

  return {
    nbEffectifsCreated,
    nbDossiers: { migrated: nbDossiersMigrated, notMigrated: nbDossiersNotMigrated },
    nbOrganismes: {
      existant: nbOrganismeExistant,
      created: nbOrganismeCreated,
      notCreated: nbOrganismeCreatedErrors,
    },
  };
};
