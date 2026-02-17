import { captureException } from "@sentry/node";
import { program } from "commander";
import { addJob, startJobProcessor as startJobProcessorFn } from "job-processor";
import HttpTerminator from "lil-http-terminator";
import { ObjectId } from "mongodb";

import logger from "./common/logger";
import { closeMongodbConnection } from "./common/mongodb";
import { closeSentry, initSentryProcessor } from "./common/services/sentry/sentry";
import { sleep } from "./common/utils/asyncUtils";
import config from "./config";
import createServer from "./http/server";
import { startEffectifQueueProcessor } from "./jobs/ingestion/process-ingestion";

async function startJobProcessor(signal: AbortSignal) {
  logger.info(`Process jobs queue - start`);
  await startJobProcessorFn(signal);
  logger.info(`Processor shut down`);
}

function createProcessExitSignal() {
  const abortController = new AbortController();

  let shutdownInProgress = false;
  ["SIGINT", "SIGTERM", "SIGQUIT"].forEach((signal) => {
    (process as unknown as NodeJS.EventEmitter).on(signal, async () => {
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
  .configureHelp({
    sortSubcommands: true,
  })
  .showSuggestionAfterError()
  .hook("preAction", (_, actionCommand) => {
    const command = actionCommand.name();
    // on définit le module du logger en global pour distinguer les logs des jobs
    if (command !== "start") {
      logger.fields.module = `cli:${command}`;
      // Pas besoin d'init Sentry dans le cas du server car il est start automatiquement
      initSentryProcessor();
    }
  })
  .hook("postAction", async () => {
    await closeMongodbConnection();
    await closeSentry();

    setTimeout(() => {
      // Make sure to exit, even if we didn't close all ressources cleanly
      // eslint-disable-next-line no-process-exit
      process.exit(1);
    }, 60_000).unref();
  });

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
        tasks.push(startJobProcessor(signal));
      }

      await Promise.all(tasks);
    } catch (err) {
      logger.error(err);
      captureException(err);
      throw err;
    }
  });

program
  .command("queue_processor:start")
  .description("Démarre le démon qui traite les effectifs en attente")
  .action(async () => {
    initSentryProcessor();
    const signal = createProcessExitSignal();

    if (config.disable_processors) {
      // The processor will exit, and be restarted by docker every day
      await sleep(24 * 3_600_000, signal);
      return;
    }

    try {
      return await startEffectifQueueProcessor(signal);
    } catch (err) {
      captureException(err);
      logger.error(err);
    }
  });

program
  .command("job_processor:start")
  .description("Run job processor")
  .action(async () => {
    const signal = createProcessExitSignal();
    if (config.disable_processors) {
      // The processor will exit, and be restarted by docker every day
      await sleep(24 * 3_600_000, signal);
      return;
    }

    await startJobProcessor(signal);
  });

function createJobAction(name: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (options: any) => {
    try {
      const { queued = false, ...payload } = options;
      const exitCode = await addJob({
        name,
        queued,
        payload,
      });

      if (exitCode) {
        program.error("Command failed", { exitCode });
      }
    } catch (err) {
      logger.error(err);
      program.error("Command failed", { exitCode: 2 });
    }
  };
}

program
  .command("hydrate:daily")
  .description("Manually trigger the daily cron job")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("hydrate:daily"));

program
  .command("db:validate")
  .description("Validate Documents")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("db:validate"));

program.command("migrations:up").description("Run migrations up").action(createJobAction("migrations:up"));

program
  .command("migrations:status")
  .description("Check migrations status")
  .action(createJobAction("migrations:status"));

program
  .command("migrations:create")
  .description("Run migrations create")
  .requiredOption("-d, --description <string>", "description")
  .action(createJobAction("migrations:create"));

program
  .command("indexes:create")
  .description("Creation des indexes mongo")
  .option("-d, --drop", "Supprime les indexes existants avant de les recréer")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("indexes:create"));

program
  .command("indexes:recreate")
  .description("Drop and recreate indexes")
  .option("-d, --drop", "Drop indexes before recreating them")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("indexes:recreate"));

program
  .command("db:find-invalid-documents")
  .description("Recherche des documents invalides")
  .requiredOption("-c, --collection", "the collection to search for invalid documents")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("db:find-invalid-documents"));

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
  .action(createJobAction("process:effectifs-queue"));

program
  .command("process:effectifs-queue:single")
  .description("Traite un effectifQueue")
  .requiredOption("--id <effectifQueueId>", "ID de l'effectifQueue à traiter", (value) => new ObjectId(value))
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("process:effectifs-queue:single"));

program
  .command("process:effectifs-queue:remove-duplicates")
  .description("Supprime les dossiers en doublons des effectifs, en ne gardant que le plus récent")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("process:effectifs-queue:remove-duplicates"));

program
  .command("dev:generate-open-api")
  .description("Création/maj du fichier open-api.json")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("dev:generate-open-api"));

program
  .command("populate:reseaux")
  .description("Populate reséaux collection")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("populate:reseaux"));

program.command("init:dev").description("Initialisation du projet en local").action(createJobAction("init:dev"));

/**
 * Job de purge des queues
 */
program
  .command("purge:queues")
  .description("Purge des queues")
  .option("--nbDaysToKeep <number>", "Nombre de jours à conserver", (n) => parseInt(n, 10), 15)
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("purge:queues"));

/**
 * Job de lancement des scripts de fiabilisation des couples UAI SIRET
 */
program
  .command("fiabilisation:uai-siret:run")
  .description("Lancement des scripts de fiabilisation des couples UAI SIRET")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("fiabilisation:uai-siret:run"));

/**
 * Job de suppression des inscrits sans contrats dans ce statut depuis un nb de jours donné
 */
program
  .command("fiabilisation:effectifs:transform-inscritsSansContrats-en-abandons-depuis")
  .description("Suppression des inscrits sans contrats dans ce statut depuis un nombre de jours donné")
  .option("--nbJours <number>", "Nombre de jours dans le statut", (n) => parseInt(n, 10), 90)
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("fiabilisation:effectifs:transform-inscritsSansContrats-en-abandons-depuis"));

program
  .command("send-reminder-emails")
  .description("Envoi des emails de relance")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("send-reminder-emails"));

program
  .command("send-mission-locale-weekly-recap")
  .description("Envoi des emails hebdomadaires aux missions locales")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("send-mission-locale-weekly-recap"));

program
  .command("hydrate:contrats-deca-raw")
  .description("Manually trigger the creation of deca effectifs")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("hydrate:contrats-deca-raw"));

program
  .command("hydrate:effectifs:update_computed_statut")
  .description("Manually trigger the update of the computed")
  .option("--id <string>", "Id de l'organisme", (organismeId) => organismeId, null)
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("hydrate:effectifs:update_computed_statut"));

program
  .command("tmp:whatsapp:send-injoignables")
  .description("Envoyer un WhatsApp aux effectifs injoignables (rupture < 3 mois, CONTACTE_SANS_RETOUR < 1 mois)")
  .option("--dry-run", "Affiche le nombre d'effectifs éligibles sans envoyer", false)
  .option("-l, --limit <number>", "Limite le nombre d'envois", (value) => parseInt(value))
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("tmp:whatsapp:send-injoignables"));

program
  .command("job:run")
  .description("Run a job")
  .requiredOption("-n, --name <string>", "Job name")
  .option("--dry-run", "Run job in dry-run mode", false)
  .option("-q, --queued", "Run job asynchronously", false)
  .action(({ name, ...options }) => {
    return createJobAction(name)(options);
  });

export async function startCLI() {
  await program.parseAsync(process.argv);
}
