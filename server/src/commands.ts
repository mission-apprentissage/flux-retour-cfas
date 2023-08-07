import { Option, program } from "commander";
import HttpTerminator from "lil-http-terminator";
import { ObjectId } from "mongodb";

import logger from "./common/logger";
import { closeMongodbConnection } from "./common/mongodb";
import createServer from "./http/server";
import { clear, clearUsers } from "./jobs/clear/clear-all";
import { purgeEvents } from "./jobs/clear/purge-events";
import { purgeQueues } from "./jobs/clear/purge-queues";
import { findInvalidDocuments } from "./jobs/db/findInvalidDocuments";
import { recreateIndexes } from "./jobs/db/recreateIndexes";
import { removeInscritsSansContratsDepuis, transformRupturantsToAbandonsDepuis } from "./jobs/fiabilisation/effectifs";
import { getStats } from "./jobs/fiabilisation/stats";
import { buildFiabilisationUaiSiret } from "./jobs/fiabilisation/uai-siret/build";
import { updateOrganismesFiabilisationUaiSiret } from "./jobs/fiabilisation/uai-siret/update";
import { hydrateEffectifsComputed } from "./jobs/hydrate/hydrate-effectifs-computed";
import { hydrateFormationsCatalogue } from "./jobs/hydrate/hydrate-formations-catalogue";
import { hydrateOpenApi } from "./jobs/hydrate/open-api/hydrate-open-api";
import { hydrateOrganismesEffectifsCount } from "./jobs/hydrate/organismes/hydrate-effectifs_count";
import { hydrateOrganismesFromReferentiel } from "./jobs/hydrate/organismes/hydrate-organismes";
import { hydrateOrganismesBassinEmploi } from "./jobs/hydrate/organismes/hydrate-organismes-bassinEmploi";
import { hydrateOrganismesFormations } from "./jobs/hydrate/organismes/hydrate-organismes-formations";
import { hydrateFromReferentiel } from "./jobs/hydrate/organismes/hydrate-organismes-referentiel";
import { hydrateOrganismesSoltea } from "./jobs/hydrate/organismes/hydrate-organismes-soltea";
import { updateMultipleOrganismesWithApis } from "./jobs/hydrate/organismes/update-organismes-with-apis";
import { hydrateBassinsEmploi } from "./jobs/hydrate/reference/hydrate-bassins-emploi";
import { hydrateReseaux } from "./jobs/hydrate/reseaux/hydrate-reseaux";
import { removeDuplicatesEffectifsQueue } from "./jobs/ingestion/process-effectifs-queue-remove-duplicates";
import {
  startEffectifQueueProcessor,
  processEffectifQueueById,
  processEffectifsQueue,
} from "./jobs/ingestion/process-ingestion";
import { removeOrganismeAndEffectifs } from "./jobs/patches/remove-organisme-effectifs-dossiersApprenants/index";
import { removeOrganismesSansSiretSansEffectifs } from "./jobs/patches/remove-organismes-sansSiret-sansEffectifs/index";
import { updateLastTransmissionDateForOrganismes } from "./jobs/patches/update-lastTransmissionDates/index";
import { runJob } from "./jobs/scriptWrapper";
import { clearSeedAssets } from "./jobs/seed/clearAssets";
import { seedPlausibleGoals } from "./jobs/seed/plausible/goals";
import { seedAdmin, seedSample, seedSampleOrganismes, seedSampleUsers } from "./jobs/seed/start/index";
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
  .action(
    runJob(async ({ drop }) => {
      await recreateIndexes({ drop });
    })
  );

program
  .command("db:find-invalid-documents")
  .requiredOption("-c, --collection", "the collection to search for invalid documents")
  .description("Recherche des documents invalides")
  .action(
    runJob(async ({ collection }) => {
      await findInvalidDocuments(collection);
    })
  );

program
  .command("processor:start")
  .description("Démarre le démon qui traite les effectifs en attente")
  .action(
    runJob(async () => {
      await startEffectifQueueProcessor();
    })
  );

program
  .command("process:effectifs-queue")
  .description("Traite les effectifs en attente")
  .option("-f, --force", "Force le re-traitement des effectifs déjà traités")
  .option(
    "-l, --limit <number>",
    "Limite le nombre d'éléments traités (100 par défaut, 0 pour désactiver (attention, charge tous les effectifs en mémoire))",
    (value) => parseInt(value)
  )
  .option(
    "-s, --since <date>",
    "Prend les éléments à partir d'une certaine date (created_at)",
    (value) => new Date(value)
  )
  .action(
    runJob(async ({ force, limit, since }) => {
      await processEffectifsQueue({ force, limit, since });
    })
  );

program
  .command("process:effectifs-queue:single")
  .description("Traite un effectifQueue")
  .requiredOption("--id <effectifQueueId>", "ID de l'effectifQueue à traiter", (value) => new ObjectId(value))
  .action(
    runJob(async ({ id }) => {
      await processEffectifQueueById(id);
    })
  );

program
  .command("process:effectifs-queue:remove-duplicates")
  .description("Supprime les dossiers en doublons des effectifs, en ne gardant que le plus récent")
  .action(
    runJob(async () => {
      await removeDuplicatesEffectifsQueue();
    })
  );

/**
 * Job (temporaire) de suppression d'un organisme et de ses effectifs
 */
program
  .command("tmp:patches:remove-organisme-effectifs")
  .description("[TEMPORAIRE] Suppression d'un organisme avec ses effectifs")
  .requiredOption("--uai <string>", "Uai de l'organisme")
  .requiredOption("--siret <string>", "Siret de l'organisme")
  .action(
    runJob(async ({ uai, siret }) => {
      return removeOrganismeAndEffectifs({ uai, siret });
    })
  );

/**
 * Job (temporaire) de suppression des organismes sans siret & sans effectifs
 */
program
  .command("tmp:patches:remove-organismes-sansSiret-sansEffectifs")
  .description("[TEMPORAIRE] Suppression des organismes sans siret & sans effectifs")
  .action(
    runJob(async () => {
      return removeOrganismesSansSiretSansEffectifs();
    })
  );

/**
 * Job (temporaire) de MAJ des date de dernières transmission des effectifs
 */
program
  .command("tmp:patches:update-lastTransmissionDate-organismes")
  .description("[TEMPORAIRE] Mise à jour des date de dernières transmissions d'un organisme à partir de ses effectifs")
  .action(
    runJob(async () => {
      return updateLastTransmissionDateForOrganismes();
    })
  );

/**
 * Job d'initialisation de données de test
 */
program
  .command("seed:sample")
  .description("Seed sample data")
  .action(
    runJob(async () => {
      return seedSample();
    })
  );

/**
 * Job d'initialisation d'un user admin
 * Va initialiser les roles par défaut en plus
 */
program
  .command("seed:admin")
  .description("Seed user admin")
  .option("-e, --email <string>", "Email de l'utilisateur Admin")
  .action(
    runJob(async ({ email }) => {
      return seedAdmin(email?.toLowerCase());
    })
  );

/**
 * Job de seed des goals dans plausible,
 * sur les envs de dev, recette et production
 */
program
  .command("seed:plausible:goals")
  .description("Seed plausible goals")
  .action(
    runJob(async () => {
      return seedPlausibleGoals();
    })
  );

program
  .command("seed:assets:clear")
  .description("Seed plausible goals")
  .action(
    runJob(async () => {
      await clearSeedAssets();
    })
  );

/**
 * Job de nettoyage de db
 */
program
  .command("clear")
  .description("Clear projet")
  .option("-a, --all", "Tout supprimer")
  .action(
    runJob(async ({ all }) => {
      return clear({ clearAll: all });
    })
  );

program
  .command("clear:users")
  .description("Clear users")
  .action(
    runJob(async () => {
      return clearUsers();
    })
  );

program
  .command("hydrate:bassins-emploi")
  .description("Remplissage de la collection bassinsEmploi")
  .action(
    runJob(async () => {
      return hydrateBassinsEmploi();
    })
  );

program
  .command("hydrate:organismes-bassins-emploi")
  .description("Remplissage du champ organismes.adresse.bassinEmploi")
  .action(
    runJob(async () => {
      return hydrateOrganismesBassinEmploi();
    })
  );

program
  .command("hydrate:effectifs-computed")
  .description("Remplissage du champ effectifs._computed avec les attributs des organismes")
  .action(
    runJob(async () => {
      return hydrateEffectifsComputed();
    })
  );

/**
 * Job de remplissage des organismes du référentiel
 */
program
  .command("hydrate:organismes-referentiel")
  .description("Remplissage des organismes du référentiel")
  .action(
    runJob(async () => {
      return hydrateFromReferentiel();
    })
  );

/**
 * Job de remplissage des formations du catalogue
 */
program
  .command("hydrate:formations-catalogue")
  .description("Remplissage des formations du catalogue")
  .action(
    runJob(async () => {
      await hydrateFormationsCatalogue();
    })
  );

program
  .command("hydrate:organismes-formations")
  .description("Remplissage des formations des organismes")
  .action(
    runJob(async () => {
      await hydrateOrganismesFormations();
    })
  );

program
  .command("hydrate:organismes-soltea")
  .description("Remplissage des organismes du fichier SOLTEA")
  .action(
    runJob(async () => {
      await hydrateOrganismesSoltea();
    })
  );

program
  .command("dev:generate-open-api")
  .description("Création/maj du fichier open-api.json")
  .action(
    runJob(async () => {
      return hydrateOpenApi();
    })
  );

/**
 * Job de remplissage des organismes en allant ajouter / maj aux organismes existants (issus de la transmission)
 * tous les organismes du référentiel
 */
program
  .command("hydrate:organismes")
  .description("Remplissage des organismes du tableau de bord en utilisant le référentiel")
  .action(
    runJob(async () => {
      return hydrateOrganismesFromReferentiel();
    })
  );

/**
 * Job de remplissage des organismes en allant ajouter / maj aux organismes existants (issus de la transmission)
 * tous les organismes du référentiel
 */
program
  .command("hydrate:organismes-effectifs-count")
  .description("Mise à jour des organismes avec le nombre d'effectifs")
  .action(
    runJob(async () => {
      return hydrateOrganismesEffectifsCount();
    })
  );

/**
 * Job de mise à jour des organismes en allant appeler des API externes pour remplir
 * - Les informations liés au SIRET (API Entreprise)
 * - L'arbre des formations (API Catalogue)
 * - Les métiers liés (API LBA)
 */
program
  .command("update:organismes-with-apis")
  .description("Mise à jour des organismes via API externes")
  .action(
    runJob(async () => {
      return updateMultipleOrganismesWithApis();
    })
  );

/**
 * Job de remplissage & maj des d'organismes / dossiersApprenants pour les réseaux avec le nouveau format
 */
program
  .command("hydrate:reseaux")
  .description("Remplissage des réseaux pour les organismes et dossiersApprenants")
  .action(
    runJob(async () => {
      return hydrateReseaux();
    })
  );

program
  .command("init:dev")
  .description("Initialisation du projet en local")
  .action(
    runJob(async () => {
      await seedSampleOrganismes();
      await seedSampleUsers();
      await seedAdmin();
      await hydrateFromReferentiel();
      await hydrateFormationsCatalogue();
      await hydrateOrganismesFormations();
      await hydrateOrganismesFromReferentiel();
      await hydrateReseaux();
      return;
    })
  );

/**
 * Job de purge des events
 */
program
  .command("purge:events")
  .description("Purge des logs inutiles")
  .option("--nbDaysToKeep <number>", "Nombre de jours à conserver", (n) => parseInt(n, 10), 15)
  .action(
    runJob(async ({ nbDaysToKeep }) => {
      return purgeEvents(nbDaysToKeep);
    })
  );

/**
 * Job de purge des queues
 */
program
  .command("purge:queues")
  .description("Purge des queues")
  .option("--nbDaysToKeep <number>", "Nombre de jours à conserver", (n) => parseInt(n, 10), 15)
  .action(
    runJob(async ({ nbDaysToKeep }) => {
      return purgeQueues(nbDaysToKeep);
    })
  );

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
    runJob(async ({ username }) => {
      return createErpUserLegacy(username);
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
    runJob(async ({ email }) => {
      return generatePasswordUpdateTokenForUser(email);
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
    runJob(async ({ username }) => {
      return generatePasswordUpdateTokenForUserLegacy(username);
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
    runJob(async ({ token, password }) => {
      return updateUserPassword(token, password);
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
    runJob(async ({ mode }) => {
      return updateUsersApiSeeders(mode);
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
 * Job de suppression des inscrits sans contrats dans ce statut depuis un nb de jours donné
 */
program
  .command("fiabilisation:effectifs:remove-inscritsSansContrats-depuis-nbJours")
  .description("Suppression des inscrits sans contrats dans ce statut depuis un nombre de jours donné")
  .option("--nbJours <number>", "Nombre de jours dans le statut", (n) => parseInt(n, 10), 90)
  .action(
    runJob(async ({ nbJours }) => {
      return removeInscritsSansContratsDepuis(nbJours);
    })
  );

/**
 * Job de transformation des rupturants en abandon dans ce statut depuis un nombre de jours donné
 */
program
  .command("fiabilisation:effectifs:transform-rupturants-en-abandons-depuis")
  .description("Transformation des rupturants en abandon dans ce statut depuis un nombre de jours donné")
  .option("--nbJours <number>", "Nombre de jours dans le statut", (n) => parseInt(n, 10), 180)
  .action(
    runJob(async ({ nbJours }) => {
      return transformRupturantsToAbandonsDepuis(nbJours);
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
  .action(
    runJob(async () => {
      await generateTypes();
    })
  );

program.hook("preAction", (_, actionCommand) => {
  const command = actionCommand.name();
  // on définit le module du logger en global pour distinguer les logs des jobs
  if (command !== "start") {
    logger.fields.module = `job:${command}`;
  }
});

export async function startCLI() {
  await program.parseAsync(process.argv);
}
