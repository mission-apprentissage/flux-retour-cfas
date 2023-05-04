import { Option, program } from "commander";
import HttpTerminator from "lil-http-terminator";

import logger from "./common/logger";
import { closeMongodbConnection } from "./common/mongodb";
import createServer from "./http/server";
import { clear, clearUsers } from "./jobs/clear/clear-all";
import { purgeEvents } from "./jobs/clear/purge-events";
import { findInvalidDocuments } from "./jobs/db/findInvalidDocuments";
import { recreateIndexes } from "./jobs/db/recreateIndexes";
import { processEffectifsQueueEndlessly } from "./jobs/fiabilisation/dossiersApprenants/process-effectifs-queue";
import { removeDuplicatesEffectifsQueue } from "./jobs/fiabilisation/dossiersApprenants/process-effectifs-queue-remove-duplicates";
import { getStats } from "./jobs/fiabilisation/stats";
import { buildFiabilisationUaiSiret } from "./jobs/fiabilisation/uai-siret/build";
import { updateOrganismesFiabilisationUaiSiret } from "./jobs/fiabilisation/uai-siret/update";
import { hydrateEffectifsComputed } from "./jobs/hydrate/hydrate-effectifs-computed";
import { hydrateFormationsCatalogue } from "./jobs/hydrate/hydrate-formations-catalogue";
import { hydrateOpenApi } from "./jobs/hydrate/open-api/hydrate-open-api";
import { hydrateOrganismesEffectifsCount } from "./jobs/hydrate/organismes/hydrate-effectifs_count";
import { hydrateOrganismesFromReferentiel } from "./jobs/hydrate/organismes/hydrate-organismes";
import { hydrateFromReferentiel } from "./jobs/hydrate/organismes/hydrate-organismes-referentiel";
import { updateOrganismesWithApis } from "./jobs/hydrate/organismes/update-organismes-with-apis";
import { hydrateReseaux } from "./jobs/hydrate/reseaux/hydrate-reseaux";
import { removeOrganismeAndEffectifs } from "./jobs/patches/remove-organisme-effectifs-dossiersApprenants/index";
import { removeOrganismesSansSiretSansEffectifs } from "./jobs/patches/remove-organismes-sansSiret-sansEffectifs/index";
import { updateLastTransmissionDateForOrganismes } from "./jobs/patches/update-lastTransmissionDates/index";
import { runJob } from "./jobs/scriptWrapper";
import { clearSeedAssets } from "./jobs/seed/clearAssets";
import { seedPlausibleGoals } from "./jobs/seed/plausible/goals";
import { seedSample, seedAdmin } from "./jobs/seed/start/index";
import { generateTypes } from "./jobs/seed/types/generate-types";
import { createErpUserLegacy } from "./jobs/users/create-user";
import {
  generatePasswordUpdateTokenForUser,
  generatePasswordUpdateTokenForUserLegacy,
} from "./jobs/users/generate-password-update-token";
import { updateUsersApiSeeders } from "./jobs/users/update-apiSeeders";
// import { analyseFiabiliteDossierApprenantsRecus } from "./fiabilisation/dossiersApprenants/analyse-fiabilite-dossiers-apprenants-recus";
import { updateUserPassword } from "./jobs/users/update-user-password";

program.configureHelp({
  sortSubcommands: true,
});

program
  .command("start")
  .description("Démarre le serveur HTTP")
  .action(async () => {
    const server = await createServer();
    const httpServer = server.listen(5000, () => logger.info(`Server ready and listening on port ${5000}`));

    let shutdownInProgress = false;
    ["SIGINT", "SIGTERM", "SIGQUIT"].forEach((signal) => {
      (process as NodeJS.EventEmitter).on(signal, async () => {
        try {
          if (shutdownInProgress) {
            logger.warn(`application shut down (FORCED) (signal=${signal})`);
            process.exit(0); // eslint-disable-line no-process-exit
          }
          shutdownInProgress = true;
          logger.warn(`application shutting down (signal=${signal})`);
          await HttpTerminator({
            server: httpServer,
            maxWaitTimeout: 50_000,
            logger: logger,
          }).terminate();
          await closeMongodbConnection();
          logger.warn("application shut down");
          process.exit(0); // eslint-disable-line no-process-exit
        } catch (err) {
          logger.error({ err }, "error during shutdown");
          process.exit(1); // eslint-disable-line no-process-exit
        }
      });
    });
  });

program
  .command("indexes:create")
  .description("Creation des indexes mongo")
  .option("-d, --drop", "Supprime les indexes existants avant de les recréer")
  .action(runJob(recreateIndexes));

program
  .command("db:find-invalid-documents")
  .description("Recherche des documents invalides")
  .requiredOption("-c, --collection", "collection to search for invalid documents")
  .action(runJob(findInvalidDocuments));

program
  .command("process:effectifs-queue")
  .description("Process la queue des effectifs")
  .option("--id <string>", "ID de l'effectifQueue à traiter")
  .option("-f, --force", "Force le re-traitement des effectifs déjà traités")
  .action(runJob(processEffectifsQueueEndlessly));

program
  .command("process:effectifs-queue:remove-duplicates")
  .description("Process la queue des effectifs")
  .action(runJob(removeDuplicatesEffectifsQueue));

/**
 * Job (temporaire) de suppression d'un organisme et de ses effectifs
 */
program
  .command("tmp:patches:remove-organisme-effectifs")
  .description("[TEMPORAIRE] Suppression d'un organisme avec ses effectifs")
  .requiredOption("--uai <string>", "Uai de l'organisme")
  .requiredOption("--siret <string>", "Siret de l'organisme")
  .action(runJob(removeOrganismeAndEffectifs));

/**
 * Job (temporaire) de suppression des organismes sans siret & sans effectifs
 */
program
  .command("tmp:patches:remove-organismes-sansSiret-sansEffectifs")
  .description("[TEMPORAIRE] Suppression des organismes sans siret & sans effectifs")
  .action(runJob(removeOrganismesSansSiretSansEffectifs));

/**
 * Job (temporaire) de MAJ des date de dernières transmission des effectifs
 */
program
  .command("tmp:patches:update-lastTransmissionDate-organismes")
  .description("[TEMPORAIRE] Mise à jour des date de dernières transmissions d'un organisme à partir de ses effectifs")
  .action(runJob(updateLastTransmissionDateForOrganismes));

/**
 * Job d'initialisation de données de test
 */
program.command("seed:sample").description("Seed sample data").action(runJob(seedSample));

/**
 * Job d'initialisation d'un user admin
 * Va initialiser les roles par défaut en plus
 */
program
  .command("seed:admin")
  .description("Seed user admin")
  .option("-e, --email <string>", "Email de l'utilisateur Admin")
  .action(runJob(seedAdmin));

/**
 * Job de seed des goals dans plausible,
 * sur les envs de dev, recette et production
 */
program.command("seed:plausible:goals").description("Seed plausible goals").action(runJob(seedPlausibleGoals));

program.command("seed:assets:clear").description("Seed plausible goals").action(runJob(clearSeedAssets));

/**
 * Job de nettoyage de db
 */
program
  .command("clear")
  .description("Clear projet")
  .option("-a, --all", "Tout supprimer")
  .action(
    runJob(async (logger, { all }) => {
      return clear(logger, { clearAll: all });
    })
  );

program.command("clear:users").description("Clear users").action(runJob(clearUsers));

program
  .command("hydrate:effectifs-computed")
  .description("Remplissage du champ effectifs._computed avec les attributs des organismes")
  .action(runJob(hydrateEffectifsComputed));

/**
 * Job de remplissage des organismes du référentiel
 */
program
  .command("hydrate:organismes-referentiel")
  .description("Remplissage des organismes du référentiel")
  .action(runJob(hydrateFromReferentiel));

/**
 * Job de remplissage des formations du catalogue
 */
program
  .command("hydrate:formations-catalogue")
  .description("Remplissage des formations du catalogue")
  .action(runJob(hydrateFormationsCatalogue));

program.command("hydrate:open-api").description("Création/maj du fichier open-api.json").action(runJob(hydrateOpenApi));

/**
 * Job de remplissage des organismes en allant ajouter / maj aux organismes existants (issus de la transmission)
 * tous les organismes du référentiel
 */
program
  .command("hydrate:organismes")
  .description("Remplissage des organismes via le référentiel")
  .action(runJob(hydrateOrganismesFromReferentiel));

/**
 * Job de remplissage des organismes en allant ajouter / maj aux organismes existants (issus de la transmission)
 * tous les organismes du référentiel
 */
program
  .command("hydrate:organismes-effectifs-count")
  .description("Mise à jour des organismes avec le nombre d'effectifs")
  .action(runJob(hydrateOrganismesEffectifsCount));

/**
 * Job de mise à jour des organismes en allant appeler des API externes pour remplir
 * - Les informations liés au SIRET (API Entreprise)
 * - L'arbre des formations (API Catalogue)
 * - Les métiers liés (API LBA)
 */
program
  .command("update:organismes-with-apis")
  .description("Mise à jour des organismes via API externes")
  .action(runJob(updateOrganismesWithApis));

/**
 * Job de remplissage & maj des d'organismes / dossiersApprenants pour les réseaux avec le nouveau format
 */
program
  .command("hydrate:reseaux")
  .description("Remplissage des réseaux pour les organismes et dossiersApprenants")
  .action(runJob(hydrateReseaux));

/**
 * Job de purge des events
 */
program
  .command("purge:events")
  .description("Purge des logs inutiles")
  .option("--nbDaysToKeep <number>", "Nombre de jours à conserver", (n) => parseInt(n, 10), 15)
  .action(runJob(purgeEvents));

/**
 * Job de création d'un utilisateur
 */
// program
//   .command("create:user")
//   .description("Création d'un utilisateur")
//   .requiredOption("--email <string>", "Email de l'utilisateur")
//   .option("--prenom <string>", "Prénom de l'utilisateur")
//   .option("--nom <string>", "Nom de l'utilisateur")
//   .action(
//     runJob(async ({ email, prenom, nom }) => {
//       return createUserAccount({
//         email,
//         prenom,
//         nom,
//       });
//     })
//   );

/**
 * Job de création d'un utilisateur ERP legacy
 */
program
  .command("create:erp-user-legacy")
  .description("Création d'un utilisateur ERP legacy")
  .requiredOption("--username <string>", "Nom de l'utilisateur")
  .action(
    runJob(async (logger, { username }) => {
      return createErpUserLegacy(logger, username);
    })
  );

/**
 * Job de génération d'un token de MAJ de mot de passe pour un utilisateur
 */
program
  .command("generate:password-update-token")
  .description("Génération d'un token de MAJ de mot de passe pour un utilisateur")
  .requiredOption("--email <string>", "Email de l'utilisateur")
  .action(
    runJob(async (logger, { email }) => {
      return generatePasswordUpdateTokenForUser(logger, email);
    })
  );

/**
 * Job de génération d'un token de MAJ de mot de passe pour un utilisateur legacy (ancien modèle)
 */
program
  .command("generate-legacy:password-update-token")
  .description("Génération d'un token de MAJ de mot de passe pour un utilisateur legacy")
  .requiredOption("--username <string>", "username de l'utilisateur")
  .action(
    runJob(async (logger, { username }) => {
      return generatePasswordUpdateTokenForUserLegacy(logger, username);
    })
  );

/**
 * Job de de MAJ de mot de passe pour un utilisateur legacy (ancien modèle) via son token
 */
program
  .command("update:user-legacy:password")
  .description("Modification du mot de passe d'un utilisateur legacy via son token de MAJ ")
  .requiredOption("--token <string>", "token d'update de password")
  .requiredOption("--password <string>", "nouveau mot de passe")
  .action(
    runJob(async (logger, { token, password }) => {
      return updateUserPassword(logger, token, password);
    })
  );

/**
 * TEMPORAIRE
 * Job de mise à jour des utilisateurs fournisseurs de données
 * Va modifier leur permission en mode actif / inactif pour temporairement bloquer l'envoi des données
 */
program
  .command("tmp:users:update-apiSeeders")
  .description("[TEMPORAIRE] Modification des utilisateurs fournisseurs de données")
  .addOption(new Option("--mode <mode>", "Mode de mise à jour").choices(["active", "inactive"]).makeOptionMandatory())
  .action(
    runJob(async (logger, { mode }) => {
      return updateUsersApiSeeders(logger, mode);
    })
  );

/**
 * Job de lancement des scripts de fiabilisation des couples UAI SIRET
 */
program
  .command("fiabilisation:uai-siret:run")
  .description("Lancement des scripts de fiabilisation des couples UAI SIRET")
  .action(
    runJob(async () => {
      // On lance séquentiellement 2 fois de suite la construction (build) de la collection fiabilisation suivi de la MAJ des données liées (apply)
      // Nécessaire pour le bon fonctionnement de l'algo
      await buildFiabilisationUaiSiret();
      await updateOrganismesFiabilisationUaiSiret();
      const buildResults = await buildFiabilisationUaiSiret();
      const updateResults = await updateOrganismesFiabilisationUaiSiret();

      return { buildResults, updateResults };
    })
  );

/**
 * Job d'analyse de la fiabilité des dossiersApprenants reçus
 */
// program
//   .command("fiabilisation:analyse:dossiersApprenants-recus")
//   .description("Analyse de la fiabilité des dossiersApprenants reçus")
//   .action(
//     runJob(async () => {
//       return analyseFiabiliteDossierApprenantsRecus();
//     })
//   );

/**
 * Job d'affichage des stats fiabilisation
 */
program
  .command("fiabilisation:stats")
  .description("Affichage de stats sur le service")
  .action(
    runJob(async () => {
      await getStats();
    })
  );

/**
 * Job d'affichage des stats fiabilisation
 */
program
  .command("dev:generate-ts-types")
  .description("Generation des types TS à partir des schemas de la base de données")
  .action(runJob(generateTypes));

export async function startCLI() {
  await program.parseAsync(process.argv);
}
