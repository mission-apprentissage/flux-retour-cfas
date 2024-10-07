import { addJob, initJobProcessor } from "job-processor";
import { getAnneesScolaireListFromDate } from "shared/utils";

import { apiAlternanceClient } from "@/common/apis/apiAlternance";
import logger from "@/common/logger";
import { createCollectionIndexes } from "@/common/model/indexes/createCollectionIndexes";
import { getDatabase } from "@/common/mongodb";
import config from "@/config";
import { create as createMigration, status as statusMigration, up as upMigration } from "@/jobs/migrations/migrations";

import { clear, clearOrganismesRuleIds, clearUsers } from "./clear/clear-all";
import { purgeQueues } from "./clear/purge-queues";
import { findInvalidDocuments } from "./db/findInvalidDocuments";
import { recreateIndexes } from "./db/recreateIndexes";
import { validateModels } from "./db/schemaValidation";
import { sendReminderEmails } from "./emails/reminder";
import { transformSansContratsToAbandonsDepuis, transformRupturantsToAbandonsDepuis } from "./fiabilisation/effectifs";
import { hydrateRaisonSocialeEtEnseigneOFAInconnus } from "./fiabilisation/ofa-inconnus";
import { getStats } from "./fiabilisation/stats";
import { buildFiabilisationUaiSiret } from "./fiabilisation/uai-siret/build";
import { resetOrganismesFiabilisationStatut } from "./fiabilisation/uai-siret/build.utils";
import {
  updateOrganismesFiabilisationApiUaiSiret,
  updateOrganismesFiabilisationUaiSiret,
} from "./fiabilisation/uai-siret/update";
import { hydrateVoeuxEffectifsRelations } from "./hydrate/affelnet/hydrate-voeux-effectifs";
import { hydrateDeca } from "./hydrate/deca/hydrate-deca";
import { hydrateDecaRaw } from "./hydrate/deca/hydrate-deca-raw";
import { updateDecaFormation } from "./hydrate/deca/update-deca-formation";
import {
  hydrateEffectifsComputed,
  hydrateEffectifsComputedOpcos,
  hydrateEffectifsComputedReseaux,
} from "./hydrate/effectifs/hydrate-effectifs-computed";
import { hydrateEffectifsComputedTypes } from "./hydrate/effectifs/hydrate-effectifs-computed-types";
import { hydrateEffectifsFormationsNiveaux } from "./hydrate/effectifs/hydrate-effectifs-formations-niveaux";
import { cleanEffectifsSource, hydrateEffectifsSource } from "./hydrate/effectifs/update-effectifs-source";
import { hydrateEffectifsQueueSource } from "./hydrate/effectifs-queue/update-effectifs-queue-source";
import { hydrateFormationsCatalogue } from "./hydrate/hydrate-formations-catalogue";
import { hydrateOrganismesOPCOs } from "./hydrate/hydrate-organismes-opcos";
import { hydrateRNCP } from "./hydrate/hydrate-rncp";
import { hydrateROME } from "./hydrate/hydrate-rome";
import { initOpcos } from "./hydrate/opcos/opcos";
import { hydrateOpenApi } from "./hydrate/open-api/hydrate-open-api";
import {
  hydrateOrganismesEffectifsCountWithHierarchy,
  updateOrganismesDecaTransmitter,
} from "./hydrate/organismes/hydrate-effectifs-count-with-hierarchy";
import { hydrateOrganismesEffectifsCount } from "./hydrate/organismes/hydrate-effectifs_count";
import { hydrateOrganismesFromReferentiel } from "./hydrate/organismes/hydrate-organismes";
import { hydrateOrganismesBassinEmploi } from "./hydrate/organismes/hydrate-organismes-bassinEmploi";
import { hydrateOrganismesFormations } from "./hydrate/organismes/hydrate-organismes-formations";
import { hydrateOrganismesPrepaApprentissage } from "./hydrate/organismes/hydrate-organismes-prepa-apprentissage";
import { hydrateFromReferentiel } from "./hydrate/organismes/hydrate-organismes-referentiel";
import { hydrateOrganismesRelations } from "./hydrate/organismes/hydrate-organismes-relations";
import { hydrateOrganismesSoltea } from "./hydrate/organismes/hydrate-organismes-soltea";
import { updateAllOrganismesRelatedFormations } from "./hydrate/organismes/update-organismes-with-apis";
import { hydrateBassinsEmploi } from "./hydrate/reference/hydrate-bassins-emploi";
import { hydrateReseaux } from "./hydrate/reseaux/hydrate-reseaux";
import { removeDuplicatesEffectifsQueue } from "./ingestion/process-effectifs-queue-remove-duplicates";
import { processEffectifQueueById, processEffectifsQueue } from "./ingestion/process-ingestion";
import { removeOrganismeAndEffectifs } from "./patches/remove-organisme-effectifs-dossiersApprenants";
import { removeOrganismesAbsentsReferentielSansTransmission } from "./patches/remove-organismes-absentReferentiel-sansTransmission";
import { removeOrganismeSansEnseigneNiRaisonSocialeNeTransmettantPlus } from "./patches/remove-organismes-sansEnseigneNiRaisonSocialeNeTransmettantPlus";
import { removeOrganismesSansSiretSansEffectifs } from "./patches/remove-organismes-sansSiret-sansEffectifs";
import { removeMetiersFromOrganisme } from "./patches/removeMetiersFromOrganisme";
import { updateFirstTransmissionDateForOrganismes } from "./patches/update-firstTransmissionDates";
import { updateLastTransmissionDateForOrganismes } from "./patches/update-lastTransmissionDates";
import { clearSeedAssets } from "./seed/clearAssets";
import { seedAdmin, seedSample, seedSampleOrganismes, seedSampleUsers } from "./seed/start";
// import { generateTypes } from "./seed/types/generate-types";
import { createErpUserLegacy } from "./users/create-user";
import {
  generatePasswordUpdateTokenForUser,
  generatePasswordUpdateTokenForUserLegacy,
} from "./users/generate-password-update-token";
import { updateUsersApiSeeders } from "./users/update-apiSeeders";

const dailyJobs = async () => {
  await addJob({ name: "hydrate:organismes-referentiel", queued: true });

  // # Remplissage des formations issus du catalogue
  await addJob({ name: "hydrate:formations-catalogue", queued: true });

  // # Remplissage des organismes depuis le référentiel
  await addJob({ name: "hydrate:organismes", queued: true });

  // # Mise à jour des relations
  await addJob({ name: "hydrate:organismes-relations", queued: true });

  // # Mise a jour des bassin d'emploi
  await addJob({ name: "hydrate:organismes-bassins-emploi", queued: true });

  // # Remplissage des formations des organismes
  await addJob({ name: "hydrate:organismes-formations", queued: true });

  // # Remplissage des OPCOs
  await addJob({ name: "hydrate:opcos", queued: true });

  // # Remplissage des réseaux
  await addJob({ name: "hydrate:reseaux", queued: true });

  // # Remplissage des ofa inconnus
  await addJob({ name: "hydrate:ofa-inconnus", queued: true });

  // # Lancement des scripts de fiabilisation des couples UAI - SIRET
  await addJob({ name: "fiabilisation:uai-siret:run", queued: true });

  // # Mise à jour des organismes via APIs externes
  // Désactivations temporaire car trop long à executer
  // await addJob({ name: "update:organismes-with-apis", queued: true });

  // # Mise à jour des niveaux des formations des effectifs
  await addJob({ name: "effectifs-formation-niveaux", queued: true });

  // # Purge des collections events et queues
  await addJob({ name: "purge:queues", queued: true });

  // # Mise a jour du nb d'effectifs
  await addJob({ name: "hydrate:organismes-effectifs-count", queued: true });

  // # Fiabilisation des effectifs : transformation des inscrits sans contrats en abandon > 90 jours & transformation des rupturants en abandon > 180 jours
  await addJob({
    name: "fiabilisation:effectifs:transform-inscritsSansContrats-en-abandons-depuis",
    queued: true,
  });
  await addJob({ name: "fiabilisation:effectifs:transform-rupturants-en-abandons-depuis", queued: true });

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
              handler: dailyJobs,
            },

            "Send reminder emails at 7h": {
              cron_string: "0 7 * * *",
              handler: async () => {
                await addJob({ name: "send-reminder-emails", queued: true });
                return 0;
              },
            },

            "Run hydrate contrats DECA job each day at 19h45": {
              cron_string: "45 19 * * *",
              handler: async () => {
                // # Remplissage des contrats DECA
                await addJob({ name: "hydrate:contratsDeca", queued: true, payload: { drop: false, full: false } });

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
        handler: async () => {
          await seedSampleOrganismes();
          await seedSampleUsers();
          await seedAdmin();
          await hydrateFromReferentiel();
          await hydrateFormationsCatalogue();
          await hydrateOrganismesFormations();
          await hydrateOrganismesFromReferentiel();
          await hydrateReseaux();
          return;
        },
      },
      "hydrate:daily": {
        handler: dailyJobs,
      },
      "seed:sample": {
        handler: async () => {
          return seedSample();
        },
      },
      "seed:admin": {
        handler: async (job) => {
          return seedAdmin((job.payload as any)?.email?.toLowerCase());
        },
      },
      "seed:assets:clear": {
        handler: async () => {
          return clearSeedAssets();
        },
      },
      clear: {
        handler: async (job) => {
          return clear(job.payload as any);
        },
      },
      "clear:users": {
        handler: async () => {
          return clearUsers();
        },
      },
      "clear:organismes-rules-ids": {
        handler: async () => {
          return clearOrganismesRuleIds();
        },
      },
      "hydrate:bassins-emploi": {
        handler: async () => {
          return hydrateBassinsEmploi();
        },
      },
      "hydrate:organismes-bassins-emploi": {
        handler: async () => {
          return hydrateOrganismesBassinEmploi();
        },
      },
      "hydrate:effectifs-computed": {
        handler: async () => {
          return hydrateEffectifsComputed();
        },
      },
      "tmp:effectifs:update_computed_statut": {
        handler: async () => {
          return hydrateEffectifsComputedTypes();
        },
      },
      "hydrate:effectifs:update_computed_statut": {
        handler: async () => {
          return await addJob({ name: "tmp:effectifs:update_computed_statut", queued: true });
        },
      },
      "hydrate:effectifs-formation-niveaux": {
        handler: async () => {
          return hydrateEffectifsFormationsNiveaux();
        },
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
      "hydrate:rome": {
        handler: async () => {
          return hydrateROME();
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
      "hydrate:organismes-soltea": {
        handler: async () => {
          return hydrateOrganismesSoltea();
        },
      },
      "hydrate:organismes-prepa-apprentissage": {
        handler: async () => {
          return hydrateOrganismesPrepaApprentissage();
        },
      },
      "hydrate:contratsDeca": {
        handler: async (job) => {
          return hydrateDeca(job.payload as any);
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
      "hydrate:organismes-effectifs-count-with-hierarchy": {
        handler: async () => {
          return hydrateOrganismesEffectifsCountWithHierarchy();
        },
      },
      "update:organismes-with-apis": {
        handler: async () => {
          return updateAllOrganismesRelatedFormations();
        },
      },
      "update:organismes-deca-transmitter": {
        handler: async () => {
          return updateOrganismesDecaTransmitter();
        },
      },
      "hydrate:opcos": {
        handler: async () => {
          return hydrateOrganismesOPCOs();
        },
      },
      "hydrate:computed-effectifs-by-opcos": {
        handler: async (job) => {
          return hydrateEffectifsComputedOpcos((job.payload as any)?.opco);
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
      "hydrate:effectifs-computed-organismes-reseaux": {
        handler: async () => {
          return hydrateEffectifsComputedReseaux();
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
      "create:erp-user-legacy": {
        handler: async (job) => {
          return createErpUserLegacy((job.payload as any)?.username);
        },
      },
      "generate:password-update-token": {
        handler: async (job) => {
          return generatePasswordUpdateTokenForUser((job.payload as any)?.email);
        },
      },
      "generate-legacy:password-update-token": {
        handler: async (job) => {
          return generatePasswordUpdateTokenForUserLegacy((job.payload as any)?.username);
        },
      },
      "tmp:users:update-apiSeeders": {
        handler: async (job) => {
          return updateUsersApiSeeders((job.payload as any)?.mode);
        },
      },
      "fiabilisation:uai-siret:run": {
        handler: async () => {
          // On reset le statut de fiabilisation de tous les organismes
          await resetOrganismesFiabilisationStatut();
          // On lance séquentiellement 2 fois de suite la construction (build) de la collection fiabilisation suivi de la MAJ des données liées (apply)
          // Nécessaire pour le bon fonctionnement de l'algo
          await buildFiabilisationUaiSiret();
          await updateOrganismesFiabilisationUaiSiret();
          const buildResults = await buildFiabilisationUaiSiret();
          const updateResults = await updateOrganismesFiabilisationUaiSiret();

          // Mise à jour des données de fiabilisation des couples UAI - SIRET à partir de l'API apprentissage
          await updateOrganismesFiabilisationApiUaiSiret();

          return { buildResults, updateResults };
        },
      },
      "fiabilisation:effectifs:transform-inscritsSansContrats-en-abandons-depuis": {
        handler: async (job) => {
          return transformSansContratsToAbandonsDepuis((job.payload as any)?.nbJours);
        },
      },
      "fiabilisation:effectifs:transform-rupturants-en-abandons-depuis": {
        handler: async (job) => transformRupturantsToAbandonsDepuis((job.payload as any)?.nbJours),
      },
      "fiabilisation:stats": {
        handler: async () => {
          return getStats();
        },
      },
      "send-reminder-emails": {
        handler: async () => {
          return sendReminderEmails();
        },
      },
      "tmp:patches:update-lastTransmissionDate-organismes": {
        handler: async () => {
          return updateLastTransmissionDateForOrganismes();
        },
      },
      "tmp:patches:update-firstTransmissionDate-organismes": {
        handler: async () => {
          return updateFirstTransmissionDateForOrganismes();
        },
      },
      "tmp:patches:remove-organismes-sansSiret-sansEffectifs": {
        handler: async () => {
          return removeOrganismesSansSiretSansEffectifs();
        },
      },
      "tmp:patches:remove-organisme-effectifs": {
        handler: async (job) => {
          return removeOrganismeAndEffectifs(job.payload as any);
        },
      },
      "tmp:patches:remove-organismes-absentsReferentiel-sansTransmission": {
        handler: async () => {
          return removeOrganismesAbsentsReferentielSansTransmission();
        },
      },
      "tmp:patches:remove-organismes-sansEnseigneNiRaisonSociale-neTransmettantPlus": {
        handler: async () => {
          return removeOrganismeSansEnseigneNiRaisonSocialeNeTransmettantPlus();
        },
      },
      "tmp:patches:remove-metiers-from-organisme": {
        handler: async () => {
          return removeMetiersFromOrganisme();
        },
      },
      "tmp:patches:update-deca-formation": {
        handler: async () => {
          return updateDecaFormation();
        },
      },
      "tmp:patches:update-effectifs-source": {
        handler: async () => {
          return hydrateEffectifsSource();
        },
      },
      "tmp:patches:update-effectifs-queue-source": {
        handler: async () => {
          return hydrateEffectifsQueueSource();
        },
      },
      "tmp:patches:clean-extra-source-in-effectifs": {
        handler: async () => {
          return cleanEffectifsSource();
        },
      },
      "tmp:patches:init_opco_rncp": {
        handler: async (job) => {
          const { name, rncpList } = job.payload as any;
          return initOpcos(name, rncpList);
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
      "test:organisme:validate": {
        handler: async () => {
          const r = await apiAlternanceClient.organisme
            .recherche({
              siret: "51400512300062",
              uai: "0333326L",
            })
            .catch((e) => {
              console.error(e);
            });
          console.log(r);
        },
      },
    },
  });
}
