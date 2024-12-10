import { addJob, initJobProcessor } from "job-processor";
import { MongoError } from "mongodb";
import { MOTIF_SUPPRESSION } from "shared/constants";
import type { IEffectif } from "shared/models";
import type { IEffectifDECA } from "shared/models/data/effectifsDECA.model";
import { getAnneesScolaireListFromDate } from "shared/utils";

import { softDeleteEffectif } from "@/common/actions/effectifs.actions";
import logger from "@/common/logger";
import { effectifsDb, effectifsDECADb } from "@/common/model/collections";
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
import {
  fiabilisationEffectifFormation,
  getEffectifCertification,
} from "./fiabilisation/certification/fiabilisation-certification";
import { transformSansContratsToAbandonsDepuis, transformRupturantsToAbandonsDepuis } from "./fiabilisation/effectifs";
import { hydrateRaisonSocialeEtEnseigneOFAInconnus } from "./fiabilisation/ofa-inconnus";
import { updateOrganismesFiabilisationStatut } from "./fiabilisation/uai-siret/updateFiabilisation";
import { hydrateVoeuxEffectifsRelations } from "./hydrate/affelnet/hydrate-voeux-effectifs";
import { hydrateDecaRaw } from "./hydrate/deca/hydrate-deca-raw";
import { hydrateEffectifsComputedTypes } from "./hydrate/effectifs/hydrate-effectifs-computed-types";
import { hydrateEffectifsFormationsNiveaux } from "./hydrate/effectifs/hydrate-effectifs-formations-niveaux";
import {
  hydrateEffectifsLieuDeFormation,
  hydrateEffectifsLieuDeFormationVersOrganismeFormateur,
} from "./hydrate/effectifs/update-effectifs-lieu-de-formation";
import { hydrateFormationsCatalogue } from "./hydrate/hydrate-formations-catalogue";
import { hydrateOrganismesOPCOs } from "./hydrate/hydrate-organismes-opcos";
import { hydrateRNCP } from "./hydrate/hydrate-rncp";
import { hydrateOpenApi } from "./hydrate/open-api/hydrate-open-api";
import { hydrateOrganismesEffectifsCount } from "./hydrate/organismes/hydrate-effectifs_count";
import { hydrateOrganismesFromReferentiel } from "./hydrate/organismes/hydrate-organismes";
import { hydrateOrganismesFormations } from "./hydrate/organismes/hydrate-organismes-formations";
import { hydrateFromReferentiel } from "./hydrate/organismes/hydrate-organismes-referentiel";
import { hydrateOrganismesRelations } from "./hydrate/organismes/hydrate-organismes-relations";
import { hydrateReseaux } from "./hydrate/reseaux/hydrate-reseaux";
import { removeDuplicatesEffectifsQueue } from "./ingestion/process-effectifs-queue-remove-duplicates";
import { processEffectifQueueById, processEffectifsQueue } from "./ingestion/process-ingestion";
import { validationTerritoires } from "./territoire/validationTerritoire";

const dailyJobs = async (queued: boolean) => {
  await addJob({ name: "hydrate:organismes-referentiel", queued });

  // # Remplissage des formations issus du catalogue
  await addJob({ name: "hydrate:formations-catalogue", queued });

  // # Remplissage des organismes depuis le référentiel
  await addJob({ name: "hydrate:organismes", queued });

  // # Mise à jour des relations
  await addJob({ name: "hydrate:organismes-relations", queued });

  // # Remplissage des formations des organismes
  await addJob({ name: "hydrate:organismes-formations", queued });

  // # Remplissage des OPCOs
  await addJob({ name: "hydrate:opcos", queued });

  // # Remplissage des réseaux
  await addJob({ name: "hydrate:reseaux", queued });

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

            "Send reminder emails at 7h": {
              cron_string: "0 7 * * *",
              handler: async () => {
                await addJob({ name: "send-reminder-emails", queued: true });
                return 0;
              },
            },

            "Mettre à jour les statuts d'effectifs le 1er de chaque mois à 00h45": {
              cron_string: "45 0 1 * *",
              handler: async () => {
                await addJob({ name: "hydrate:effectifs:update_computed_statut_month", queued: true });
                return 0;
              },
            },
            "Mettre à jour les effectifs DECA tous les dimanches matin à 6h": {
              cron_string: "0 6 * * 0",
              handler: async () => {
                await addJob({ name: "hydrate:contrats-deca-raw", queued: true });
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
      "hydrate:daily": {
        handler: async () => dailyJobs(true),
      },
      "hydrate:organismes-referentiel": {
        handler: async () => {
          return hydrateFromReferentiel();
        },
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
      "hydrate:organismes-formations": {
        handler: async () => {
          return hydrateOrganismesFormations();
        },
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
      "hydrate:effectifs:update_computed_statut_month": {
        handler: async () => {
          return hydrateEffectifsComputedTypes({
            query: { annee_scolaire: { $in: getAnneesScolaireListFromDate(new Date()) } },
          });
        },
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
        handler: async () => {
          return hydrateOrganismesFromReferentiel();
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
      "hydrate:reseaux": {
        handler: async () => {
          return hydrateReseaux();
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
      "tmp:migration:formation-certification": {
        handler: async (job, signal) => {
          // In case of interruption, we can restart the job from the last processed effectif
          // Any updated effectif has either been updated by the job or has been updated by the processing queue

          const processEffectif = async (effectif: IEffectif) => {
            const certification = await getEffectifCertification(effectif);

            const update = {
              formation: fiabilisationEffectifFormation(effectif, certification),
              "_raw.formation": effectif.formation,
              _computed: {
                ...effectif._computed,
                formation: {
                  ...effectif._computed?.formation,
                  codes_rome: certification?.domaines.rome.rncp?.map(({ code }) => code) ?? null,
                },
              },
            };

            await effectifsDb()
              .updateOne({ _id: effectif._id }, { $set: update })
              .catch(async (err) => {
                // If the document is a duplicated effectif, we can safely remove the older document
                if (err instanceof MongoError && err.code === 11000) {
                  await softDeleteEffectif(effectif._id, null, {
                    motif: MOTIF_SUPPRESSION.Doublon,
                    description: "Suppression du doublon suite à la migration des formations",
                  });
                  return;
                }

                throw err;
              });
          };

          const cursorEffectif = effectifsDb().find(
            { created_at: { $lte: job.created_at } },
            { sort: { created_at: -1 } }
          );
          let bulkEffectifs: IEffectif[] = [];
          for await (const effectif of cursorEffectif) {
            if (effectif._raw?.formation) {
              // Already migrated
              continue;
            }

            bulkEffectifs.push(effectif);

            if (bulkEffectifs.length > 100) {
              await Promise.all(bulkEffectifs.map(processEffectif));
              if (signal.aborted) {
                return;
              }
              bulkEffectifs = [];
            }
          }
          if (bulkEffectifs.length > 0) {
            await Promise.all(bulkEffectifs.map(processEffectif));
          }

          const processEffectifDeca = async (effectif: IEffectifDECA) => {
            const certification = await getEffectifCertification(effectif);

            const update = {
              formation: fiabilisationEffectifFormation(effectif, certification),
              _computed: {
                ...effectif._computed,
                formation: {
                  ...effectif._computed?.formation,
                  codes_rome: certification?.domaines.rome.rncp?.map(({ code }) => code) ?? null,
                },
              },
            };

            await effectifsDECADb().updateOne({ _id: effectif._id }, { $set: update });
          };

          const cursorEffectifDeca = effectifsDECADb().find(
            { created_at: { $lte: job.created_at } },
            { sort: { created_at: -1 } }
          );
          let bulkEffectifsDeca: IEffectifDECA[] = [];
          for await (const effectif of cursorEffectifDeca) {
            bulkEffectifsDeca.push(effectif);

            if (bulkEffectifsDeca.length > 100) {
              await Promise.all(bulkEffectifsDeca.map(processEffectifDeca));
              if (signal.aborted) {
                return;
              }
              bulkEffectifsDeca = [];
            }
          }
          if (bulkEffectifsDeca.length > 0) {
            await Promise.all(bulkEffectifsDeca.map(processEffectifDeca));
          }

          // TODO: Formation v2 migration
        },
        resumable: true,
      },
    },
  });
}
