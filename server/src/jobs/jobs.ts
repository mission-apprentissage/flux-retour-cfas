import logger from "@/common/logger";
import { IJob } from "@/common/model/job.model";
import { create as createMigration, status as statusMigration, up as upMigration } from "@/jobs/migrations/migrations";

import { clear, clearUsers } from "./clear/clear-all";
import { purgeEvents } from "./clear/purge-events";
import { purgeQueues } from "./clear/purge-queues";
import { cronsInit, cronsScheduler } from "./crons_actions";
import { findInvalidDocuments } from "./db/findInvalidDocuments";
import { recreateIndexes } from "./db/recreateIndexes";
import { validateModels } from "./db/schemaValidation";
import { removeInscritsSansContratsDepuis, transformRupturantsToAbandonsDepuis } from "./fiabilisation/effectifs";
import { getStats } from "./fiabilisation/stats";
import { buildFiabilisationUaiSiret } from "./fiabilisation/uai-siret/build";
import { resetOrganismesFiabilisationStatut } from "./fiabilisation/uai-siret/build.utils";
import { updateOrganismesFiabilisationUaiSiret } from "./fiabilisation/uai-siret/update";
import { hydrateDeca } from "./hydrate/deca/hydrate-deca";
import { hydrateEffectifsComputed } from "./hydrate/effectifs/hydrate-effectifs-computed";
import { hydrateEffectifsFormationsNiveaux } from "./hydrate/effectifs/hydrate-effectifs-formations-niveaux";
import { hydrateFormationsCatalogue } from "./hydrate/hydrate-formations-catalogue";
import { hydrateRNCP } from "./hydrate/hydrate-rncp";
import { hydrateOpenApi } from "./hydrate/open-api/hydrate-open-api";
import { hydrateOrganismesEffectifsCount } from "./hydrate/organismes/hydrate-effectifs_count";
import { hydrateOrganismesFromReferentiel } from "./hydrate/organismes/hydrate-organismes";
import { hydrateOrganismesBassinEmploi } from "./hydrate/organismes/hydrate-organismes-bassinEmploi";
import { hydrateOrganismesFormations } from "./hydrate/organismes/hydrate-organismes-formations";
import { hydrateOrganismesPrepaApprentissage } from "./hydrate/organismes/hydrate-organismes-prepa-apprentissage";
import { hydrateFromReferentiel } from "./hydrate/organismes/hydrate-organismes-referentiel";
import { hydrateOrganismesRelations } from "./hydrate/organismes/hydrate-organismes-relations";
import { hydrateOrganismesSoltea } from "./hydrate/organismes/hydrate-organismes-soltea";
import { updateMultipleOrganismesWithApis } from "./hydrate/organismes/update-organismes-with-apis";
import { hydrateBassinsEmploi } from "./hydrate/reference/hydrate-bassins-emploi";
import { hydrateReseaux } from "./hydrate/reseaux/hydrate-reseaux";
import { removeDuplicatesEffectifsQueue } from "./ingestion/process-effectifs-queue-remove-duplicates";
import { processEffectifQueueById, processEffectifsQueue } from "./ingestion/process-ingestion";
import { addJob, executeJob } from "./jobs_actions";
import { removeOrganismeAndEffectifs } from "./patches/remove-organisme-effectifs-dossiersApprenants";
import { removeOrganismesAbsentsReferentielSansTransmission } from "./patches/remove-organismes-absentReferentiel-sansTransmission";
import { removeOrganismeSansEnseigneNiRaisonSocialeNeTransmettantPlus } from "./patches/remove-organismes-sansEnseigneNiRaisonSocialeNeTransmettantPlus";
import { removeOrganismesSansSiretSansEffectifs } from "./patches/remove-organismes-sansSiret-sansEffectifs";
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

interface CronDef {
  name: string;
  cron_string: string;
  handler: () => Promise<number>;
}

export const CRONS: Record<string, CronDef> = {
  "Run daily jobs each day at 02h30": {
    name: "Run daily jobs each day at 02h30",
    cron_string: "30 2 * * *",
    handler: async () => {
      // # Remplissage des organismes issus du référentiel
      await addJob({ name: "hydrate:organismes-referentiel", queued: true });

      // # Remplissage des organismes depuis le référentiel
      await addJob({ name: "hydrate:organismes", queued: true });

      // # Mise à jour des relations
      await addJob({ name: "hydrate:organismes-relations", queued: true });

      // # Remplissage des réseaux
      await addJob({ name: "hydrate:reseaux", queued: true });

      // # Lancement des scripts de fiabilisation des couples UAI - SIRET
      await addJob({ name: "fiabilisation:uai-siret:run", queued: true });

      // # Mise à jour des organismes via APIs externes
      await addJob({ name: "update:organismes-with-apis", queued: true });

      // # Mise à jour des niveaux des formations des effectifs
      await addJob({ name: "effectifs-formation-niveaux", queued: true });

      // # Purge des collections events et queues
      await addJob({ name: "purge:events", queued: true });
      await addJob({ name: "purge:queues", queued: true });

      // # Mise a jour du nb d'effectifs
      await addJob({ name: "hydrate:organismes-effectifs-count", queued: true });

      // # Fiabilisation des effectifs : suppression des inscrits sans contrats depuis 90 jours & transformation des rupturants en abandon > 180 jours
      await addJob({ name: "fiabilisation:effectifs:remove-inscritsSansContrats-depuis-nbJours", queued: true });
      await addJob({ name: "fiabilisation:effectifs:transform-rupturants-en-abandons-depuis", queued: true });

      return 0;
    },
  },

  "Run hydrate contrats DECA job each day at 19h45": {
    name: "Run hydrate contrats DECA job each day at 19h45",
    cron_string: "45 19 * * *",
    handler: async () => {
      // # Remplissage des contrats DECA
      await addJob({ name: "hydrate:contratsDeca", queued: true });

      return 0;
    },
  },

  // TODO : Checker si coté métier l'archivage est toujours prévu ?
  // "Run archive dossiers apprenants & effectifs job each first day of month at 12h45": {
  //   name: "Run archive dossiers apprenants & effectifs job each first day of month at 12h45",
  //   cron_string: "45 12 1 * *",
  //   handler: async () => {
  //     // run-archive-job.sh yarn cli archive:dossiersApprenantsEffectifs
  //     return 0;
  //   },
  // },
};

export async function runJob(job: IJob): Promise<number> {
  return executeJob(job, async () => {
    if (job.type === "cron_task") {
      return CRONS[job.name].handler();
    }
    switch (job.name) {
      case "init:dev":
        await seedSampleOrganismes();
        await seedSampleUsers();
        await seedAdmin();
        await hydrateFromReferentiel();
        await hydrateFormationsCatalogue();
        await hydrateOrganismesFormations();
        await hydrateOrganismesFromReferentiel();
        await hydrateReseaux();
        return;
      case "seed:sample":
        return seedSample();
      case "seed:admin":
        return seedAdmin((job.payload as any)?.email?.toLowerCase());
      case "seed:assets:clear":
        return clearSeedAssets();
      case "clear":
        return clear(job.payload as any);
      case "clear:users":
        return clearUsers();
      case "hydrate:bassins-emploi":
        return hydrateBassinsEmploi();
      case "hydrate:organismes-bassins-emploi":
        return hydrateOrganismesBassinEmploi();
      case "hydrate:effectifs-computed":
        return hydrateEffectifsComputed();
      case "hydrate:effectifs-formation-niveaux":
        return hydrateEffectifsFormationsNiveaux();
      case "hydrate:organismes-referentiel":
        return hydrateFromReferentiel();
      case "hydrate:formations-catalogue":
        return hydrateFormationsCatalogue();
      case "hydrate:rncp":
        return hydrateRNCP();
      case "hydrate:organismes-formations":
        return hydrateOrganismesFormations();
      case "hydrate:organismes-relations":
        return hydrateOrganismesRelations();
      case "hydrate:organismes-soltea":
        return hydrateOrganismesSoltea();
      case "hydrate:organismes-prepa-apprentissage":
        return hydrateOrganismesPrepaApprentissage();
      case "hydrate:contratsDeca":
        return hydrateDeca(job.payload as any);
      case "dev:generate-open-api":
        return hydrateOpenApi();
      case "hydrate:organismes":
        return hydrateOrganismesFromReferentiel();
      case "hydrate:organismes-effectifs-count":
        return hydrateOrganismesEffectifsCount();
      case "update:organismes-with-apis":
        return updateMultipleOrganismesWithApis();
      case "hydrate:reseaux":
        return hydrateReseaux();
      case "purge:events":
        return purgeEvents((job.payload as any)?.nbDaysToKeep);
      case "purge:queues":
        return purgeQueues((job.payload as any)?.nbDaysToKeep);
      case "create:erp-user-legacy":
        return createErpUserLegacy((job.payload as any)?.username);
      case "generate:password-update-token":
        return generatePasswordUpdateTokenForUser((job.payload as any)?.email);
      case "generate-legacy:password-update-token":
        return generatePasswordUpdateTokenForUserLegacy((job.payload as any)?.username);
      case "tmp:users:update-apiSeeders":
        return updateUsersApiSeeders((job.payload as any)?.mode);
      case "fiabilisation:uai-siret:run": {
        // On reset le statut de fiabilisation de tous les organismes
        await resetOrganismesFiabilisationStatut();
        // On lance séquentiellement 2 fois de suite la construction (build) de la collection fiabilisation suivi de la MAJ des données liées (apply)
        // Nécessaire pour le bon fonctionnement de l'algo
        await buildFiabilisationUaiSiret();
        await updateOrganismesFiabilisationUaiSiret();
        const buildResults = await buildFiabilisationUaiSiret();
        const updateResults = await updateOrganismesFiabilisationUaiSiret();

        return { buildResults, updateResults };
      }
      case "fiabilisation:effectifs:remove-inscritsSansContrats-depuis-nbJours":
        return removeInscritsSansContratsDepuis((job.payload as any)?.nbJours);
      case "fiabilisation:effectifs:transform-rupturants-en-abandons-depuis":
        return transformRupturantsToAbandonsDepuis((job.payload as any)?.nbJours);
      case "fiabilisation:stats":
        return getStats();
      // case "dev:generate-ts-types":
      //   return generateTypes();
      case "tmp:patches:update-lastTransmissionDate-organismes":
        return updateLastTransmissionDateForOrganismes();
      case "tmp:patches:remove-organismes-sansSiret-sansEffectifs":
        return removeOrganismesSansSiretSansEffectifs();
      case "tmp:patches:remove-organisme-effectifs":
        return removeOrganismeAndEffectifs(job.payload as any);
      case "tmp:patches:remove-organismes-absentsReferentiel-sansTransmission":
        return removeOrganismesAbsentsReferentielSansTransmission();
      case "tmp:patches:remove-organismes-sansEnseigneNiRaisonSociale-neTransmettantPlus":
        return removeOrganismeSansEnseigneNiRaisonSocialeNeTransmettantPlus();
      case "process:effectifs-queue:remove-duplicates":
        return removeDuplicatesEffectifsQueue();
      case "process:effectifs-queue:single":
        return processEffectifQueueById((job.payload as any)?.id);
      case "process:effectifs-queue":
        return processEffectifsQueue(job.payload as any);
      case "db:find-invalid-documents":
        return findInvalidDocuments((job.payload as any)?.collection);
      case "indexes:create":
      case "indexes:recreate":
        return recreateIndexes((job.payload as any)?.drop);
      case "db:validate":
        return validateModels();
      case "migrations:up": {
        await upMigration();
        // Validate all documents after the migration
        await addJob({ name: "db:validate", queued: true });
        return;
      }
      case "migrations:status": {
        const pendingMigrations = await statusMigration();
        console.log(`migrations-status=${pendingMigrations === 0 ? "synced" : "pending"}`);
        return;
      }
      case "migrations:create":
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return createMigration(job.payload as any);
      case "crons:init": {
        await cronsInit();
        return;
      }
      case "crons:scheduler":
        return cronsScheduler();

      default: {
        logger.warn(`Job not found ${job.name}`);
      }
    }
  });
}
