import { addJob, initJobProcessor } from "job-processor";
import { ObjectId } from "mongodb";
import { getAnneesScolaireListFromDate, substractDaysUTC } from "shared/utils";

import logger from "@/common/logger";
import { createCollectionIndexes } from "@/common/model/indexes/createCollectionIndexes";
import { getDatabase } from "@/common/mongodb";
import config from "@/config";
import { create as createMigration, status as statusMigration, up as upMigration } from "@/jobs/migrations/migrations";

import { purgeQueues } from "./clear/purge-queues";
import { updateComputedFields } from "./computed/update-computed";
import { findInvalidDocuments } from "./db/findInvalidDocuments";
import { recreateIndexes } from "./db/recreateIndexes";
import { validateModels } from "./db/schemaValidation";
import { sendReminderEmails } from "./emails/reminder";
import { transformSansContratsToAbandonsDepuis, transformRupturantsToAbandonsDepuis } from "./fiabilisation/effectifs";
import { hydrateRaisonSocialeEtEnseigneOFAInconnus } from "./fiabilisation/ofa-inconnus";
import { updateOrganismesFiabilisationStatut } from "./fiabilisation/uai-siret/updateFiabilisation";
import { hydrateVoeuxEffectifsRelations } from "./hydrate/affelnet/hydrate-voeux-effectifs";
import { hydrateDecaRaw } from "./hydrate/deca/hydrate-deca-raw";
import { hydrateEffectifsComputedTypesGenerique } from "./hydrate/effectifs/hydrate-effectifs-computed-types";
import { hydrateEffectifsFormationsNiveaux } from "./hydrate/effectifs/hydrate-effectifs-formations-niveaux";
import {
  hydrateEffectifsLieuDeFormation,
  hydrateEffectifsLieuDeFormationVersOrganismeFormateur,
} from "./hydrate/effectifs/update-effectifs-lieu-de-formation";
import { hydrateFormationV2 } from "./hydrate/formations/hydrate-formation-v2";
import { hydrateFormationsCatalogue } from "./hydrate/hydrate-formations-catalogue";
import { hydrateOrganismesOPCOs } from "./hydrate/hydrate-organismes-opcos";
import { hydrateRNCP } from "./hydrate/hydrate-rncp";
import {
  hydrateMissionLocaleAdresse,
  hydrateMissionLocaleOrganisation,
  hydrateMissionLocaleSnapshot,
  updateMissionLocaleEffectifCurrentStatus,
  updateMissionLocaleSnapshotFromLastStatus,
} from "./hydrate/mission-locale/hydrate-mission-locale";
import { hydrateOpenApi } from "./hydrate/open-api/hydrate-open-api";
import { hydrateOrganismesEffectifsCount } from "./hydrate/organismes/hydrate-effectifs_count";
import { hydrateOrganismesFromApiAlternance } from "./hydrate/organismes/hydrate-organismes";
import { hydrateOrganismesFormationsCount } from "./hydrate/organismes/hydrate-organismes-formations";
import { hydrateOrganismesRelations } from "./hydrate/organismes/hydrate-organismes-relations";
import { cleanupOrganismes } from "./hydrate/organismes/organisme-cleanup";
import { populateReseauxCollection } from "./hydrate/reseaux/hydrate-reseaux";
import { removeDuplicatesEffectifsQueue } from "./ingestion/process-effectifs-queue-remove-duplicates";
import { processEffectifQueueById, processEffectifsQueue } from "./ingestion/process-ingestion";
import { migrateEffectifs } from "./ingestion/process-ingestion.v2";
import { validationTerritoires } from "./territoire/validationTerritoire";

const dailyJobs = async (queued: boolean) => {
  // # Remplissage des formations issus du catalogue
  await addJob({ name: "hydrate:formations-catalogue", queued });

  await addJob({ name: "import:formation", queued });

  await addJob({ name: "import:formation", queued });

  // # Remplissage des organismes depuis le référentiel
  await addJob({ name: "hydrate:organismes", queued });

  // # Mise à jour des relations
  await addJob({ name: "hydrate:organismes-relations", queued });

  // # Mise à jour du compteur de formations par organisme
  await addJob({ name: "hydrate:organismes-formations-count", queued });

  // # Remplissage des OPCOs
  await addJob({ name: "hydrate:opcos", queued });

  // # Remplissage des ofa inconnus
  await addJob({ name: "hydrate:ofa-inconnus", queued });

  // # Lancement des scripts de fiabilisation des couples UAI - SIRET
  await addJob({ name: "fiabilisation:uai-siret:run", queued });

  // # Mise à jour des niveaux des formations des effectifs
  await addJob({ name: "hydrate:effectifs-formation-niveaux", queued: true });

  // # Purge des collections events et queues
  await addJob({ name: "purge:queues", queued });

  // # Mise a jour du nb d'effectifs
  await addJob({ name: "hydrate:organismes-effectifs-count", queued });

  // # Fiabilisation des effectifs : transformation des inscrits sans contrats en abandon > 90 jours & transformation des rupturants en abandon > 180 jours
  await addJob({
    name: "fiabilisation:effectifs:transform-inscritsSansContrats-en-abandons-depuis",
    queued,
  });

  await addJob({ name: "fiabilisation:effectifs:transform-rupturants-en-abandons-depuis", queued });

  await addJob({ name: "hydrate:rncp", queued });

  await addJob({ name: "computed:update", queued });

  await addJob({ name: "organisme:cleanup", queued });

  // # Mise à jour des effectifs DECA
  await addJob({ name: "hydrate:contrats-deca-raw", queued });

  return 0;
};

export async function setupJobProcessor() {
  return initJobProcessor({
    db: getDatabase(),
    logger,
    crons:
      config.env === "preview" || config.env === "local"
        ? {}
        : {
            "Run daily jobs each day at 02h30": {
              cron_string: "30 2 * * *",
              handler: async () => dailyJobs(true),
            },

            "Cleanup organismes": {
              cron_string: "0 3 * * *",
              handler: cleanupOrganismes,
            },

            "Import formations": {
              cron_string: "0 3 * * *",
              handler: hydrateFormationV2,
            },

            "Send reminder emails at 7h": {
              cron_string: "0 7 * * *",
              handler: async () => {
                await addJob({ name: "send-reminder-emails", queued: true });
                return 0;
              },
            },

            "Mettre à jour les statuts d'effectifs tous les samedis matin à 5h": {
              cron_string: "0 5 * * 6",
              handler: async () => {
                await addJob({ name: "hydrate:effectifs:update_computed_statut", queued: true });
                return 0;
              },
            },
            "Validation des constantes de territoires": {
              cron_string: "5 4 1 * *",
              handler: validationTerritoires,
            },
            // TODO : Checker si coté métier l'archivage est toujours prévu ?
            // "Run archive dossiers apprenants & effectifs job each first day of month at 12h45": {
            //   cron_string: "45 12 1 * *",
            //   handler: async () => {
            //     // run-archive-job.sh yarn cli archive:dossiersApprenantsEffectifs
            //     return 0;
            //   },
            // },
          },
    jobs: {
      "init:dev": {
        handler: async () => dailyJobs(false),
      },
      "import:formation": {
        handler: hydrateFormationV2,
      },
      "hydrate:daily": {
        handler: async () => dailyJobs(true),
      },
      "hydrate:formations-catalogue": {
        handler: async () => {
          return hydrateFormationsCatalogue();
        },
      },
      "hydrate:rncp": {
        handler: async () => {
          return hydrateRNCP();
        },
      },
      "hydrate:organismes-formations-count": {
        handler: hydrateOrganismesFormationsCount,
      },
      "hydrate:organismes-relations": {
        handler: async () => {
          return hydrateOrganismesRelations();
        },
      },
      "hydrate:contrats-deca-raw": {
        handler: async () => {
          return hydrateDecaRaw();
        },
      },
      "organisme:cleanup": {
        handler: cleanupOrganismes,
      },
      "hydrate:effectifs:update_all_computed_statut": {
        handler: async () => {
          return hydrateEffectifsComputedTypesGenerique();
        },
      },
      "hydrate:effectifs:update_computed_statut": {
        handler: async (job, signal) => {
          const organismeId = (job.payload?.id as string) ? new ObjectId(job.payload?.id as string) : null;
          const evaluationDate = new Date();
          return hydrateEffectifsComputedTypesGenerique(
            {
              query: {
                annee_scolaire: { $in: getAnneesScolaireListFromDate(evaluationDate) },
                updated_at: { $lt: substractDaysUTC(evaluationDate, 7) },
                ...(organismeId ? { organisme_id: organismeId } : {}),
              },
            },
            signal
          );
        },
        resumable: true,
      },
      "hydrate:effectifs-formation-niveaux": {
        handler: async () => {
          return hydrateEffectifsFormationsNiveaux();
        },
      },
      "dev:generate-open-api": {
        handler: async () => {
          return hydrateOpenApi();
        },
      },
      "hydrate:organismes": {
        handler: async (job) => {
          return hydrateOrganismesFromApiAlternance(job.started_at ?? new Date());
        },
      },
      "hydrate:organismes-effectifs-count": {
        handler: async () => {
          return hydrateOrganismesEffectifsCount();
        },
      },
      "hydrate:opcos": {
        handler: async () => {
          return hydrateOrganismesOPCOs();
        },
      },
      "hydrate:ofa-inconnus": {
        handler: async () => {
          return hydrateRaisonSocialeEtEnseigneOFAInconnus();
        },
      },
      "hydrate:update-effectifs-lieu-de-formation": {
        handler: async () => {
          return hydrateEffectifsLieuDeFormation();
        },
      },
      "hydrate:update-effectifs-organisme-lieu-vers-formateur": {
        handler: async () => {
          return hydrateEffectifsLieuDeFormationVersOrganismeFormateur();
        },
      },
      "hydrate:voeux-effectifs-relations": {
        handler: async () => {
          return hydrateVoeuxEffectifsRelations();
        },
      },
      "hydrate:mission-locale-effectif-snapshot": {
        handler: async (job) => {
          const missionLocaleStructureId = (job.payload?.ml_id as string)
            ? parseInt(job.payload?.ml_id as string)
            : null;
          return hydrateMissionLocaleSnapshot(missionLocaleStructureId);
        },
      },
      "hydrate:mission-locale-organisation": {
        handler: async () => {
          return hydrateMissionLocaleOrganisation();
        },
      },
      "tmp:mission-locale-snapshot-update": {
        handler: async () => {
          return updateMissionLocaleSnapshotFromLastStatus();
        },
      },
      "tmp:mission-locale-adresse-update": {
        handler: async () => {
          return hydrateMissionLocaleAdresse();
        },
      },
      "populate:reseaux": {
        handler: async () => {
          return populateReseauxCollection();
        },
      },
      "purge:queues": {
        handler: async (job) => {
          return purgeQueues((job.payload as any)?.nbDaysToKeep);
        },
      },
      "fiabilisation:uai-siret:run": {
        handler: updateOrganismesFiabilisationStatut,
      },
      "fiabilisation:effectifs:transform-inscritsSansContrats-en-abandons-depuis": {
        handler: async (job) => {
          return transformSansContratsToAbandonsDepuis((job.payload as any)?.nbJours);
        },
      },
      "fiabilisation:effectifs:transform-rupturants-en-abandons-depuis": {
        handler: async (job) => transformRupturantsToAbandonsDepuis((job.payload as any)?.nbJours),
      },
      "send-reminder-emails": {
        handler: async () => {
          return sendReminderEmails();
        },
      },
      "process:effectifs-queue:remove-duplicates": {
        handler: async () => {
          return removeDuplicatesEffectifsQueue();
        },
      },
      "process:effectifs-queue:single": {
        handler: async (job) => {
          return processEffectifQueueById((job.payload as any)?.id);
        },
      },
      "process:effectifs-queue": {
        handler: async (job) => {
          return processEffectifsQueue(job.payload as any);
        },
      },
      "db:find-invalid-documents": {
        handler: async (job) => {
          return findInvalidDocuments((job.payload as any)?.collection);
        },
      },
      "indexes:create": {
        handler: async (job) => {
          return recreateIndexes((job.payload as any)?.drop);
        },
      },
      "indexes:recreate": {
        handler: async (job) => {
          return recreateIndexes((job.payload as any)?.drop);
        },
      },
      "indexes:collection:create": {
        handler: async (job) => {
          return createCollectionIndexes((job.payload as any)?.collection);
        },
      },
      "db:validate": {
        handler: async () => {
          return validateModels();
        },
      },
      "territoire:validate": {
        handler: validationTerritoires,
      },
      "computed:update": {
        handler: updateComputedFields,
      },
      "migrations:up": {
        handler: async () => {
          await upMigration();
          // Validate all documents after the migration
          await addJob({ name: "db:validate", queued: true });
          return;
        },
      },
      "migrations:status": {
        handler: async () => {
          const pendingMigrations = await statusMigration();
          console.log(`migrations-status=${pendingMigrations === 0 ? "synced" : "pending"}`);
          return;
        },
      },
      "migrations:create": {
        handler: async (job) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return createMigration(job.payload as any);
        },
      },
      "tmp:migrate:effectifs": {
        handler: migrateEffectifs,
      },
      "tmp:migrate:mission-locale-current-status": {
        handler: async () => {
          return updateMissionLocaleEffectifCurrentStatus();
        },
      },
    },
  });
}
