import { captureException } from "@sentry/node";
import { Option, program } from "commander";
import HttpTerminator from "lil-http-terminator";
import { ObjectId } from "mongodb";

import logger from "./common/logger";
import { closeMongodbConnection } from "./common/mongodb";
import { closeSentry, initSentryProcessor } from "./common/services/sentry/sentry";
import config from "./config";
import createServer from "./http/server";
import { addJob, processor } from "./jobs/jobs_actions";

program
  .configureHelp({
    sortSubcommands: true,
  })
  .hook("postAction", async () => {
    await closeMongodbConnection();
    await closeSentry();
  });

async function startProcessor(signal: AbortSignal) {
  logger.info(`Process jobs queue - start`);
  await addJob({
    name: "crons:init",
    queued: true,
  });

  await processor(signal);
  logger.info(`Processor shut down`);
}

function createProcessExitSignal() {
  const abortController = new AbortController();

  let shutdownInProgress = false;
  ["SIGINT", "SIGTERM", "SIGQUIT"].forEach((signal) => {
    (process as NodeJS.EventEmitter).on(signal, async () => {
      try {
        if (shutdownInProgress) {
          const message = `Server shut down (FORCED) (signal=${signal})`;
          logger.warn(message);
          // eslint-disable-next-line no-process-exit
          process.exit(1);
        }

        shutdownInProgress = true;
        logger.info(`Server is shutting down (signal=${signal})`);
        abortController.abort();
      } catch (err) {
        captureException(err);
        logger.error({ err }, "error during shutdown");
      }
    });
  });

  return abortController.signal;
}

program
  .command("start")
  .option("--withProcessor", "Exécution du processor également")
  .description("Démarre le serveur HTTP")
  .action(async ({ withProcessor = false }) => {
    try {
      const signal = createProcessExitSignal();

      const server = await createServer();
      const httpServer = server.listen(config.port, () =>
        logger.info(`Server ready and listening on port ${config.port}`)
      );

      const terminator = HttpTerminator({
        server: httpServer,
        maxWaitTimeout: 50_000,
        logger: logger,
      });

      if (signal.aborted) {
        await terminator.terminate();
        return;
      }

      const tasks = [
        new Promise<void>((resolve, reject) => {
          signal.addEventListener("abort", async () => {
            try {
              await terminator.terminate();
              logger.warn("Server shut down");
              resolve();
            } catch (err) {
              reject(err);
            }
          });
        }),
      ];

      if (withProcessor) {
        tasks.push(startProcessor(signal));
      }

      await Promise.all(tasks);
    } catch (err) {
      logger.error(err);
      captureException(err);
      throw err;
    }
  });

program
  .command("job_processor:start")
  .description("Run job processor")
  .action(async () => {
    initSentryProcessor();
    const signal = createProcessExitSignal();
    await startProcessor(signal);
  });

program
  .command("db:validate")
  .description("Validate Documents")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(async ({ queued }) => {
    const exitCode = await addJob({
      name: "db:validate",
      queued,
    });

    if (exitCode) {
      program.error("Command failed", { exitCode });
    }
  });

program
  .command("migrations:up")
  .description("Run migrations up")
  .action(async () => {
    const exitCode = await addJob({
      name: "migrations:up",
    });
    if (exitCode) {
      program.error("Command failed", { exitCode });
    }
  });

program
  .command("migrations:status")
  .description("Check migrations status")
  .action(async () => {
    const exitCode = await addJob(
      {
        name: "migrations:status",
      },
      { runningLogs: false }
    );
    if (exitCode) {
      program.error("Command failed", { exitCode });
    }
  });

program
  .command("migrations:create")
  .description("Run migrations create")
  .requiredOption("-d, --description <string>", "description")
  .action(async ({ description }) => {
    const exitCode = await addJob({
      name: "migrations:create",
      payload: { description },
    });
    if (exitCode) {
      program.error("Command failed", { exitCode });
    }
  });

program
  .command("indexes:create")
  .description("Creation des indexes mongo")
  .option("-d, --drop", "Supprime les indexes existants avant de les recréer")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(async ({ drop, queued }) => {
    const exitCode = await addJob({
      name: "indexes:create",
      payload: drop,
      queued,
    });

    if (exitCode) {
      program.error("Command failed", { exitCode });
    }
  });
program
  .command("indexes:recreate")
  .description("Drop and recreate indexes")
  .option("-d, --drop", "Drop indexes before recreating them")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(async ({ drop, queued }) => {
    const exitCode = await addJob({
      name: "indexes:recreate",
      payload: { drop },
      queued,
    });
    if (exitCode) {
      program.error("Command failed", { exitCode });
    }
  });

program
  .command("db:find-invalid-documents")
  .description("Recherche des documents invalides")
  .requiredOption("-c, --collection", "the collection to search for invalid documents")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(async ({ collection, queued }) => {
    const exitCode = await addJob({
      name: "db:find-invalid-documents",
      payload: collection,
      queued,
    });

    if (exitCode) {
      program.error("Command failed", { exitCode });
    }
  });

program
  .command("queue_processor:start")
  .description("Démarre le démon qui traite les effectifs en attente")
  .action(async () => {
    const exitCode = await addJob({
      name: "queue_processor:start",
    });

    if (exitCode) {
      program.error("Command failed", { exitCode });
    }
  });

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
  .option("-q, --queued", "Run job asynchronously", false)
  .action(async ({ force, limit, since, queued }) => {
    const exitCode = await addJob({
      name: "process:effectifs-queue",
      payload: {
        force,
        limit,
        since,
      },
      queued,
    });

    if (exitCode) {
      program.error("Command failed", { exitCode });
    }
  });

program
  .command("process:effectifs-queue:single")
  .description("Traite un effectifQueue")
  .requiredOption("--id <effectifQueueId>", "ID de l'effectifQueue à traiter", (value) => new ObjectId(value))
  .option("-q, --queued", "Run job asynchronously", false)
  .action(async ({ id, queued }) => {
    const exitCode = await addJob({
      name: "process:effectifs-queue:single",
      payload: id,
      queued,
    });

    if (exitCode) {
      program.error("Command failed", { exitCode });
    }
  });

program
  .command("process:effectifs-queue:remove-duplicates")
  .description("Supprime les dossiers en doublons des effectifs, en ne gardant que le plus récent")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(async ({ queued }) => {
    const exitCode = await addJob({
      name: "process:effectifs-queue:remove-duplicates",
      queued,
    });

    if (exitCode) {
      program.error("Command failed", { exitCode });
    }
  });

/**
 * Job (temporaire) de suppression d'un organisme et de ses effectifs
 */
program
  .command("tmp:patches:remove-organisme-effectifs")
  .description("[TEMPORAIRE] Suppression d'un organisme avec ses effectifs")
  .requiredOption("--uai <string>", "Uai de l'organisme")
  .requiredOption("--siret <string>", "Siret de l'organisme")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(async ({ uai, siret, queued }) => {
    const exitCode = await addJob({
      name: "tmp:patches:remove-organisme-effectifs",
      payload: {
        uai,
        siret,
      },
      queued,
    });

    if (exitCode) {
      program.error("Command failed", { exitCode });
    }
  });

/**
 * Job (temporaire) de suppression des organismes sans siret & sans effectifs
 */
program
  .command("tmp:patches:remove-organismes-sansSiret-sansEffectifs")
  .description("[TEMPORAIRE] Suppression des organismes sans siret & sans effectifs")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(async ({ queued }) => {
    const exitCode = await addJob({
      name: "tmp:patches:remove-organismes-sansSiret-sansEffectifs",
      queued,
    });

    if (exitCode) {
      program.error("Command failed", { exitCode });
    }
  });

/**
 * Job (temporaire) de MAJ des date de dernières transmission des effectifs
 */
program
  .command("tmp:patches:update-lastTransmissionDate-organismes")
  .description("[TEMPORAIRE] Mise à jour des date de dernières transmissions d'un organisme à partir de ses effectifs")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(async ({ queued }) => {
    const exitCode = await addJob({
      name: "tmp:patches:update-lastTransmissionDate-organismes",
      queued,
    });

    if (exitCode) {
      program.error("Command failed", { exitCode });
    }
  });

/**
 * Job d'initialisation de données de test
 */
program
  .command("seed:sample")
  .description("Seed sample data")
  .action(async () => {
    const exitCode = await addJob({
      name: "seed:sample",
    });

    if (exitCode) {
      program.error("Command failed", { exitCode });
    }
  });

/**
 * Job d'initialisation d'un user admin
 * Va initialiser les roles par défaut en plus
 */
program
  .command("seed:admin")
  .description("Seed user admin")
  .option("-e, --email <string>", "Email de l'utilisateur Admin")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(async ({ email, queued }) => {
    const exitCode = await addJob({
      name: "seed:admin",
      payload: {
        email: email?.toLowerCase(),
      },
      queued,
    });

    if (exitCode) {
      program.error("Command failed", { exitCode });
    }
  });

/**
 * Job de seed des goals dans plausible,
 * sur les envs de dev, recette et production
 */
program
  .command("seed:plausible:goals")
  .description("Seed plausible goals")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(async ({ queued }) => {
    const exitCode = await addJob({
      name: "seed:plausible:goals",
      queued,
    });

    if (exitCode) {
      program.error("Command failed", { exitCode });
    }
  });

program
  .command("seed:assets:clear")
  .description("Seed assets clear")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(async ({ queued }) => {
    const exitCode = await addJob({
      name: "seed:assets:clear",
      queued,
    });

    if (exitCode) {
      program.error("Command failed", { exitCode });
    }
  });

/**
 * Job de nettoyage de db
 */
program
  .command("clear")
  .description("Clear projet")
  .option("-a, --all", "Tout supprimer")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(async ({ all, queued }) => {
    const exitCode = await addJob({
      name: "clear",
      payload: {
        clearAll: all,
      },
      queued,
    });

    if (exitCode) {
      program.error("Command failed", { exitCode });
    }
  });

program
  .command("clear:users")
  .description("Clear users")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(async ({ queued }) => {
    const exitCode = await addJob({
      name: "clear:users",
      queued,
    });

    if (exitCode) {
      program.error("Command failed", { exitCode });
    }
  });

program
  .command("hydrate:bassins-emploi")
  .description("Remplissage de la collection bassinsEmploi")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(async ({ queued }) => {
    const exitCode = await addJob({
      name: "hydrate:bassins-emploi",
      queued,
    });

    if (exitCode) {
      program.error("Command failed", { exitCode });
    }
  });

program
  .command("hydrate:organismes-bassins-emploi")
  .description("Remplissage du champ organismes.adresse.bassinEmploi")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(async ({ queued }) => {
    const exitCode = await addJob({
      name: "hydrate:organismes-bassins-emploi",
      queued,
    });

    if (exitCode) {
      program.error("Command failed", { exitCode });
    }
  });

program
  .command("hydrate:effectifs-computed")
  .description("Remplissage du champ effectifs._computed avec les attributs des organismes")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(async ({ queued }) => {
    const exitCode = await addJob({
      name: "hydrate:effectifs-computed",
      queued,
    });

    if (exitCode) {
      program.error("Command failed", { exitCode });
    }
  });

program
  .command("hydrate:effectifs-formation-niveaux")
  .description("Remplissage du champ niveau des formations des effectifs")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(async ({ queued }) => {
    const exitCode = await addJob({
      name: "hydrate:effectifs-formation-niveaux",
      queued,
    });

    if (exitCode) {
      program.error("Command failed", { exitCode });
    }
  });

/**
 * Job de remplissage des organismes du référentiel
 */
program
  .command("hydrate:organismes-referentiel")
  .description("Remplissage des organismes du référentiel")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(async ({ queued }) => {
    const exitCode = await addJob({
      name: "hydrate:organismes-referentiel",
      queued,
    });

    if (exitCode) {
      program.error("Command failed", { exitCode });
    }
  });

/**
 * Job de remplissage des formations du catalogue
 */
program
  .command("hydrate:formations-catalogue")
  .description("Remplissage des formations du catalogue")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(async ({ queued }) => {
    const exitCode = await addJob({
      name: "hydrate:formations-catalogue",
      queued,
    });

    if (exitCode) {
      program.error("Command failed", { exitCode });
    }
  });

program
  .command("hydrate:rncp-romes")
  .description("Remplissage du RNCP")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(async ({ queued }) => {
    const exitCode = await addJob(
      {
        name: "hydrate:rncp-romes",
        queued,
      },
      { runningLogs: true }
    );

    if (exitCode) {
      program.error("Command failed", { exitCode });
    }
  });

program
  .command("hydrate:organismes-formations")
  .description("Remplissage des formations des organismes")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(async ({ queued }) => {
    const exitCode = await addJob({
      name: "hydrate:organismes-formations",
      queued,
    });

    if (exitCode) {
      program.error("Command failed", { exitCode });
    }
  });

program
  .command("hydrate:organismes-relations")
  .description("Remplissage des relations organismes formateurs liés aux organismes")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(async ({ queued }) => {
    const exitCode = await addJob({
      name: "hydrate:organismes-relations",
      queued,
    });

    if (exitCode) {
      program.error("Command failed", { exitCode });
    }
  });

program
  .command("hydrate:organismes-soltea")
  .description("Remplissage des organismes du fichier SOLTEA")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(async ({ queued }) => {
    const exitCode = await addJob({
      name: "hydrate:organismes-soltea",
      queued,
    });

    if (exitCode) {
      program.error("Command failed", { exitCode });
    }
  });

program
  .command("dev:generate-open-api")
  .description("Création/maj du fichier open-api.json")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(async ({ queued }) => {
    const exitCode = await addJob({
      name: "dev:generate-open-api",
      queued,
    });

    if (exitCode) {
      program.error("Command failed", { exitCode });
    }
  });

/**
 * Job de remplissage des organismes en allant ajouter / maj aux organismes existants (issus de la transmission)
 * tous les organismes du référentiel
 */
program
  .command("hydrate:organismes")
  .description("Remplissage des organismes du tableau de bord en utilisant le référentiel")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(async ({ queued }) => {
    const exitCode = await addJob({
      name: "hydrate:organismes",
      queued,
    });

    if (exitCode) {
      program.error("Command failed", { exitCode });
    }
  });

/**
 * Job de remplissage des organismes en allant ajouter / maj aux organismes existants (issus de la transmission)
 * tous les organismes du référentiel
 */
program
  .command("hydrate:organismes-effectifs-count")
  .description("Mise à jour des organismes avec le nombre d'effectifs")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(async ({ queued }) => {
    const exitCode = await addJob({
      name: "hydrate:organismes-effectifs-count",
      queued,
    });

    if (exitCode) {
      program.error("Command failed", { exitCode });
    }
  });

/**
 * Job de mise à jour des organismes en allant appeler des API externes pour remplir
 * - Les informations liés au SIRET (API Entreprise)
 * - L'arbre des formations (API Catalogue)
 * - Les métiers liés (API LBA)
 */
program
  .command("update:organismes-with-apis")
  .description("Mise à jour des organismes via API externes")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(async ({ queued }) => {
    const exitCode = await addJob({
      name: "update:organismes-with-apis",
      queued,
    });

    if (exitCode) {
      program.error("Command failed", { exitCode });
    }
  });

/**
 * Job de remplissage & maj des d'organismes / dossiersApprenants pour les réseaux avec le nouveau format
 */
program
  .command("hydrate:reseaux")
  .description("Remplissage des réseaux pour les organismes et dossiersApprenants")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(async ({ queued }) => {
    const exitCode = await addJob({
      name: "hydrate:reseaux",
      queued,
    });

    if (exitCode) {
      program.error("Command failed", { exitCode });
    }
  });

program
  .command("init:dev")
  .description("Initialisation du projet en local")
  .action(async () => {
    const exitCode = await addJob({
      name: "init:dev",
    });

    if (exitCode) {
      program.error("Command failed", { exitCode });
    }
  });

/**
 * Job de purge des events
 */
program
  .command("purge:events")
  .description("Purge des logs inutiles")
  .option("--nbDaysToKeep <number>", "Nombre de jours à conserver", (n) => parseInt(n, 10), 15)
  .option("-q, --queued", "Run job asynchronously", false)
  .action(async ({ nbDaysToKeep, queued }) => {
    const exitCode = await addJob({
      name: "purge:events",
      payload: nbDaysToKeep,
      queued,
    });

    if (exitCode) {
      program.error("Command failed", { exitCode });
    }
  });

/**
 * Job de purge des queues
 */
program
  .command("purge:queues")
  .description("Purge des queues")
  .option("--nbDaysToKeep <number>", "Nombre de jours à conserver", (n) => parseInt(n, 10), 15)
  .option("-q, --queued", "Run job asynchronously", false)
  .action(async ({ nbDaysToKeep, queued }) => {
    const exitCode = await addJob({
      name: "purge:queues",
      payload: nbDaysToKeep,
      queued,
    });

    if (exitCode) {
      program.error("Command failed", { exitCode });
    }
  });

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
  .option("-q, --queued", "Run job asynchronously", false)
  .action(async ({ username, queued }) => {
    const exitCode = await addJob({
      name: "create:erp-user-legacy",
      payload: username,
      queued,
    });

    if (exitCode) {
      program.error("Command failed", { exitCode });
    }
  });

/**
 * Job de génération d'un token de MAJ de mot de passe pour un utilisateur
 */
program
  .command("generate:password-update-token")
  .description("Génération d'un token de MAJ de mot de passe pour un utilisateur")
  .requiredOption("--email <string>", "Email de l'utilisateur")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(async ({ email, queued }) => {
    const exitCode = await addJob({
      name: "generate:password-update-token",
      payload: email,
      queued,
    });

    if (exitCode) {
      program.error("Command failed", { exitCode });
    }
  });

/**
 * Job de génération d'un token de MAJ de mot de passe pour un utilisateur legacy (ancien modèle)
 */
program
  .command("generate-legacy:password-update-token")
  .description("Génération d'un token de MAJ de mot de passe pour un utilisateur legacy")
  .requiredOption("--username <string>", "username de l'utilisateur")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(async ({ username, queued }) => {
    const exitCode = await addJob({
      name: "generate-legacy:password-update-token",
      payload: username,
      queued,
    });

    if (exitCode) {
      program.error("Command failed", { exitCode });
    }
  });

/**
 * Job de de MAJ de mot de passe pour un utilisateur legacy (ancien modèle) via son token
 */
program
  .command("update:user-legacy:password")
  .description("Modification du mot de passe d'un utilisateur legacy via son token de MAJ ")
  .requiredOption("--token <string>", "token d'update de password")
  .requiredOption("--password <string>", "nouveau mot de passe")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(async ({ token, password, queued }) => {
    const exitCode = await addJob({
      name: "update:user-legacy:password",
      payload: {
        token,
        password,
      },
      queued,
    });

    if (exitCode) {
      program.error("Command failed", { exitCode });
    }
  });

/**
 * TEMPORAIRE
 * Job de mise à jour des utilisateurs fournisseurs de données
 * Va modifier leur permission en mode actif / inactif pour temporairement bloquer l'envoi des données
 */
program
  .command("tmp:users:update-apiSeeders")
  .description("[TEMPORAIRE] Modification des utilisateurs fournisseurs de données")
  .addOption(new Option("--mode <mode>", "Mode de mise à jour").choices(["active", "inactive"]).makeOptionMandatory())
  .option("-q, --queued", "Run job asynchronously", false)
  .action(async ({ mode, queued }) => {
    const exitCode = await addJob({
      name: "tmp:users:update-apiSeeders",
      payload: mode,
      queued,
    });

    if (exitCode) {
      program.error("Command failed", { exitCode });
    }
  });

/**
 * Job de lancement des scripts de fiabilisation des couples UAI SIRET
 */
program
  .command("fiabilisation:uai-siret:run")
  .description("Lancement des scripts de fiabilisation des couples UAI SIRET")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(async ({ queued }) => {
    const exitCode = await addJob({
      name: "fiabilisation:uai-siret:run",
      queued,
    });

    if (exitCode) {
      program.error("Command failed", { exitCode });
    }
  });

/**
 * Job de suppression des inscrits sans contrats dans ce statut depuis un nb de jours donné
 */
program
  .command("fiabilisation:effectifs:remove-inscritsSansContrats-depuis-nbJours")
  .description("Suppression des inscrits sans contrats dans ce statut depuis un nombre de jours donné")
  .option("--nbJours <number>", "Nombre de jours dans le statut", (n) => parseInt(n, 10), 90)
  .option("-q, --queued", "Run job asynchronously", false)
  .action(async ({ nbJours, queued }) => {
    const exitCode = await addJob({
      name: "fiabilisation:effectifs:remove-inscritsSansContrats-depuis-nbJours",
      payload: nbJours,
      queued,
    });

    if (exitCode) {
      program.error("Command failed", { exitCode });
    }
  });

/**
 * Job de transformation des rupturants en abandon dans ce statut depuis un nombre de jours donné
 */
program
  .command("fiabilisation:effectifs:transform-rupturants-en-abandons-depuis")
  .description("Transformation des rupturants en abandon dans ce statut depuis un nombre de jours donné")
  .option("--nbJours <number>", "Nombre de jours dans le statut", (n) => parseInt(n, 10), 180)
  .option("-q, --queued", "Run job asynchronously", false)
  .action(async ({ nbJours, queued }) => {
    const exitCode = await addJob({
      name: "fiabilisation:effectifs:transform-rupturants-en-abandons-depuis",
      payload: nbJours,
      queued,
    });

    if (exitCode) {
      program.error("Command failed", { exitCode });
    }
  });

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
  .option("-q, --queued", "Run job asynchronously", false)
  .action(async ({ queued }) => {
    const exitCode = await addJob({
      name: "fiabilisation:stats",
      queued,
    });

    if (exitCode) {
      program.error("Command failed", { exitCode });
    }
  });

/**
 * Job d'affichage des stats fiabilisation
 */
program
  .command("dev:generate-ts-types")
  .description("Generation des types TS à partir des schemas de la base de données")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(async ({ queued }) => {
    const exitCode = await addJob({
      name: "dev:generate-ts-types",
      queued,
    });

    if (exitCode) {
      program.error("Command failed", { exitCode });
    }
  });

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
