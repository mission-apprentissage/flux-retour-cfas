import { addJob, initJobProcessor } from "job-processor";
import { MongoError, ObjectId, WithId } from "mongodb";
import { MOTIF_SUPPRESSION } from "shared/constants";
import type { IEffectif, IOrganisation, IOrganisationOrganismeFormation } from "shared/models";
import { getAnneesScolaireListFromDate, substractDaysUTC } from "shared/utils";

import { softDeleteEffectif } from "@/common/actions/effectifs.actions";
import logger from "@/common/logger";
import { effectifsDb, effectifsDECADb, organisationsDb, organismesDb } from "@/common/model/collections";
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
import { hydrateOrganismesFromApiAlternance } from "./hydrate/organismes/hydrate-organismes";
import { hydrateOrganismesFormations } from "./hydrate/organismes/hydrate-organismes-formations";
import { hydrateOrganismesRelations } from "./hydrate/organismes/hydrate-organismes-relations";
import { hydrateReseaux } from "./hydrate/reseaux/hydrate-reseaux";
import { removeDuplicatesEffectifsQueue } from "./ingestion/process-effectifs-queue-remove-duplicates";
import { processEffectifQueueById, processEffectifsQueue } from "./ingestion/process-ingestion";
import { tmpMigrateAdresseNaissance } from "./patches/adresse/migrate-adresse-naissance";
import { tmpFiabilisationCertification } from "./patches/certification/fiabilisation-certification";
import { tmpMigrateEffectifsTransmittedAt } from "./patches/effectifs/migrate-transmitted-at";
import { validationTerritoires } from "./territoire/validationTerritoire";
import { tmpMigrationMissionLocaleEffectif } from "./tmp/mission-locale";

const dailyJobs = async (queued: boolean) => {
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

            "Mettre à jour les statuts d'effectifs tous les samedis matin à 5h": {
              cron_string: "0 5 * * 6",
              handler: async () => {
                await addJob({ name: "hydrate:effectifs:update_computed_statut", queued: true });
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
      "hydrate:effectifs:update_all_computed_statut": {
        handler: async () => {
          return hydrateEffectifsComputedTypes();
        },
      },
      "hydrate:effectifs:update_computed_statut": {
        handler: async (job, signal) => {
          const organismeId = (job.payload?.id as string) ? new ObjectId(job.payload?.id as string) : null;
          const evaluationDate = new Date();
          return hydrateEffectifsComputedTypes(
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
      "tmp:migration:duplicat-formation": {
        handler: async (job, signal) => {
          // In case of interruption, we can restart the job from the last processed effectif
          // Any updated effectif has either been updated by the job or has been updated by the processing queue

          const cursor = effectifsDb().aggregate<{
            _id: {
              annee_scolaire: IEffectif["annee_scolaire"];
              id_erp_apprenant: IEffectif["id_erp_apprenant"];
              organisme_id: IEffectif["organisme_id"];
            };
            count: number;
            effectifs: IEffectif[];
          }>([
            {
              $sort: {
                organisme_id: 1,
                id_erp_apprenant: 1,
                annee_scolaire: 1,
              },
            },
            {
              $group: {
                _id: {
                  annee_scolaire: "$annee_scolaire",
                  id_erp_apprenant: "$id_erp_apprenant",
                  organisme_id: "$organisme_id",
                },
                count: { $sum: 1 },
                effectifs: { $addToSet: "$$ROOT" },
              },
            },
            { $match: { count: { $gt: 1 } } },
          ]);

          for await (const doc of cursor) {
            const validEffectifs: IEffectif[] = [];
            const duplicatedEffectifs: IEffectif[] = [];

            // Sort effectifs in reverse updated_at order in order to keep the most recent effectif
            const effectifs = doc.effectifs.toSorted((a, b) => {
              if (a.updated_at == null) return 1;
              if (b.updated_at == null) return -1;
              return a.updated_at.getTime() > b.updated_at.getTime() ? -1 : 1;
            });

            for (const effectif of effectifs) {
              if (validEffectifs.length === 0) {
                validEffectifs.push(effectif);
                continue;
              }

              const currentCfd = effectif.formation?.cfd ?? null;
              const currentRncp = effectif.formation?.rncp ?? null;

              if (!currentCfd && !currentRncp) {
                duplicatedEffectifs.push(effectif);
                continue;
              }

              const isDuplicated = validEffectifs.some((validEffectif) => {
                const validCfd = validEffectif.formation?.cfd ?? null;
                const validRncp = validEffectif.formation?.rncp ?? null;

                const isSameCfd = validCfd === null || currentCfd === null || validCfd === currentCfd;
                const isSameRncp = validRncp === null || currentRncp === null || validRncp === currentRncp;

                return isSameCfd && isSameRncp;
              });

              if (isDuplicated) {
                duplicatedEffectifs.push(effectif);
              } else {
                validEffectifs.push(effectif);
              }
            }

            await Promise.all(
              duplicatedEffectifs.map(async (effectif) =>
                softDeleteEffectif(effectif._id, null, {
                  motif: MOTIF_SUPPRESSION.Doublon,
                  description: "Doublon de formation",
                })
              )
            );

            if (signal.aborted) {
              return;
            }
          }
        },
        resumable: true,
      },
      "tmp:migration:organisation-organisme": {
        handler: async () => {
          const organisations: Array<IOrganisation> = await organisationsDb()
            .find({
              type: "ORGANISME_FORMATION",
            })
            .toArray();

          for (let i = 0; i < organisations.length; i++) {
            const orga = organisations[i] as IOrganisationOrganismeFormation;
            const organisme = await organismesDb().findOne({ siret: orga.siret, uai: orga.uai ?? undefined });
            if (organisme) {
              await organisationsDb().updateOne(
                { _id: orga._id },
                { $set: { organisme_id: organisme._id.toString() } }
              );
            }
          }
        },
      },
      "tmp:migration:effectifs:duree_formation_relle": {
        handler: async () => {
          const batchSize = 100;
          const collection = effectifsDb();
          const cursor = collection.find(
            { "formation.date_entree": { $exists: true }, "formation.date_fin": { $exists: true } },
            { projection: { "formation.date_entree": 1, "formation.date_fin": 1 } }
          );

          let documentsProcessed = 0;

          while (await cursor.hasNext()) {
            const batch: WithId<IEffectif>[] = [];
            for (let i = 0; i < batchSize && (await cursor.hasNext()); i++) {
              const doc = await cursor.next();
              if (doc) batch.push(doc);
            }

            const bulkOps = batch
              .map((doc) => {
                const { date_entree, date_fin } = doc.formation || {};
                if (date_entree && date_fin) {
                  const dureeFormationRelle = Math.round(
                    (new Date(date_fin).getTime() - new Date(date_entree).getTime()) / 1000 / 60 / 60 / 24 / 30
                  );
                  return {
                    updateOne: {
                      filter: { _id: doc._id },
                      update: { $set: { "formation.duree_formation_relle": dureeFormationRelle } },
                    },
                  };
                }
                return null;
              })
              .filter((op): op is Exclude<typeof op, null> => op !== null);

            try {
              const result = await collection.bulkWrite(bulkOps, { ordered: false });
              documentsProcessed += result.modifiedCount;
              console.log(`Documents traités jusqu'à présent : ${documentsProcessed}`);
            } catch (err) {
              if (err instanceof MongoError) {
                console.error("Erreur MongoDB lors de l'opération bulkWrite :", err);
              } else {
                throw err;
              }
            }
          }

          console.log(`Migration terminée. Total de documents traités : ${documentsProcessed}`);
        },
      },
      "tmp:migration:hydrate-mission-locale": {
        handler: () => tmpMigrationMissionLocaleEffectif(effectifsDb()),
      },
      "tmp:migration:hydrate-mission-locale-deca": {
        handler: () => tmpMigrationMissionLocaleEffectif(effectifsDECADb()),
      },
      "tmp:migration:formation-certification": {
        handler: tmpFiabilisationCertification,
        resumable: true,
      },
      "tmp:migration:adresse-naissance": {
        handler: tmpMigrateAdresseNaissance,
      },
      "tmp:migration:effectifs-transmitted-at": {
        handler: tmpMigrateEffectifsTransmittedAt,
      },
    },
  });
}
