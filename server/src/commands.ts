import { captureException } from "@sentry/node";
import { Option, program } from "commander";
import listEndpoints from "express-list-endpoints";
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
import { seedPlausibleGoals } from "./jobs/seed/plausible/goals";
import { updateUserPassword } from "./jobs/users/update-user-password";

async function startJobProcessor(signal: AbortSignal) {
  logger.info(`Process jobs queue - start`);
  await startJobProcessorFn(signal);
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
/**
 * Job (temporaire) de suppression d'un organisme et de ses effectifs
 */
program
  .command("tmp:patches:remove-organisme-effectifs")
  .description("[TEMPORAIRE] Suppression d'un organisme avec ses effectifs")
  .requiredOption("--uai <string>", "Uai de l'organisme")
  .requiredOption("--siret <string>", "Siret de l'organisme")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("tmp:patches:remove-organisme-effectifs"));

/**
 * Job (temporaire) de suppression des organismes sans siret & sans effectifs
 */
program
  .command("tmp:patches:remove-organismes-sansSiret-sansEffectifs")
  .description("[TEMPORAIRE] Suppression des organismes sans siret & sans effectifs")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("tmp:patches:remove-organismes-sansSiret-sansEffectifs"));

/**
 * Job (temporaire) de MAJ des date de dernières transmission des effectifs
 */
program
  .command("tmp:patches:update-lastTransmissionDate-organismes")
  .description("[TEMPORAIRE] Mise à jour des date de dernières transmissions d'un organisme à partir de ses effectifs")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("tmp:patches:update-lastTransmissionDate-organismes"));

/**
 * Job (temporaire) de suppression des organismes absents du référentiel n'ayant jamais transmis
 */
program
  .command("tmp:patches:remove-organismes-absentsReferentiel-sansTransmission")
  .description("[TEMPORAIRE] Suppression des organismes absents du référentiel n'ayant jamais transmis")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("tmp:patches:remove-organismes-absentsReferentiel-sansTransmission"));

/**
 * Job (temporaire) de suppression des organismes sans enseigne ni raison sociale et ne transmettant plus
 */
program
  .command("tmp:patches:remove-organismes-sansEnseigneNiRaisonSociale-neTransmettantPlus")
  .description("[TEMPORAIRE] Suppression des organismes sans enseigne ni raison sociale et ne transmettant plus")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("tmp:patches:remove-organismes-sansEnseigneNiRaisonSociale-neTransmettantPlus"));

/**
 * Job (temporaire) de suppression de metiers dans organismes
 */
program
  .command("tmp:patches:remove-metiers-from-organisme")
  .description("[TEMPORAIRE] Suppression de metiers dans organismes")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("tmp:patches:remove-metiers-from-organisme"));

/**
 * Job d'initialisation de données de test
 */
program.command("seed:sample").description("Seed sample data").action(createJobAction("seed:sample"));

/**
 * Job d'initialisation d'un user admin
 * Va initialiser les roles par défaut en plus
 */
program
  .command("seed:admin")
  .description("Seed user admin")
  .option("-e, --email <string>", "Email de l'utilisateur Admin")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("seed:admin"));

/**
 * Job de seed des goals dans plausible,
 * sur les envs de dev, recette et production
 */
program
  .command("seed:plausible:goals")
  .description("Seed plausible goals")
  .action(async () => {
    await seedPlausibleGoals();
  });

program
  .command("seed:assets:clear")
  .description("Seed assets clear")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("seed:assets:clear"));

/**
 * Job de nettoyage de db
 */
program
  .command("clear")
  .description("Clear projet")
  .option("-a, --clearAll", "Tout supprimer")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("clear"));

program
  .command("clear:users")
  .description("Clear users")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("clear:users"));

program
  .command("clear:organismes-rules-ids")
  .description("Clear organismes extra attributes")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("clear:organismes-rules-ids"));

program
  .command("hydrate:bassins-emploi")
  .description("Remplissage de la collection bassinsEmploi")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("hydrate:bassins-emploi"));

program
  .command("hydrate:organismes-bassins-emploi")
  .description("Remplissage du champ organismes.adresse.bassinEmploi")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("hydrate:organismes-bassins-emploi"));

program
  .command("hydrate:effectifs-computed")
  .description("Remplissage du champ effectifs._computed avec les attributs des organismes")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("hydrate:effectifs-computed"));

program
  .command("tmp:effectifs:update_computed_statut")
  .description("Remplissage du champ effectifs._computed avec les types des effectifs")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("tmp:effectifs:update_computed_statut"));

program
  .command("hydrate:effectifs:update_computed_statut")
  .description("Remplissage du champ effectifs._computed avec les types des effectifs")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("hydrate:effectifs:update_computed_statut"));

program
  .command("hydrate:effectifs-formation-niveaux")
  .description("Remplissage du champ niveau des formations des effectifs")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("hydrate:effectifs-formation-niveaux"));

/**
 * Job de remplissage des organismes du référentiel
 */
program
  .command("hydrate:organismes-referentiel")
  .description("Remplissage des organismes du référentiel")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("hydrate:organismes-referentiel"));

/**
 * Job de remplissage des formations du catalogue
 */
program
  .command("hydrate:formations-catalogue")
  .description("Remplissage des formations du catalogue")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("hydrate:formations-catalogue"));

program
  .command("hydrate:rome")
  .description("Remplissage du ROME")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("hydrate:rome"));

program
  .command("hydrate:rncp")
  .description("Remplissage du RNCP")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("hydrate:rncp"));

program
  .command("hydrate:organismes-formations")
  .description("Remplissage des formations des organismes")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("hydrate:organismes-formations"));

program
  .command("hydrate:organismes-relations")
  .description("Remplissage des relations organismes formateurs liés aux organismes")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("hydrate:organismes-relations"));

program
  .command("hydrate:organismes-soltea")
  .description("Remplissage des organismes du fichier SOLTEA")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("hydrate:organismes-soltea"));

program
  .command("hydrate:organismes-prepa-apprentissage")
  .description("Remplissage des organismes du fichier Prepa Apprentissage")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("hydrate:organismes-prepa-apprentissage"));

program
  .command("hydrate:contratsDeca")
  .description("Remplissage des contrats Deca")
  .option("-q, --queued", "Run job asynchronously", false)
  .option("-d, --drop", "Supprime les contrats existants avant de les recréer", false)
  .option("-f, --full", "Récupère l'intégralité des données disponibles via l'API Deca", false)
  .action(createJobAction("hydrate:contratsDeca"));

program
  .command("hydrate:contrats-deca-raw")
  .description("Remplissage des contrats Deca")
  .option("-q, --queued", "Run job asynchronously", false)
  .option("-d, --drop", "Supprime les contrats existants avant de les recréer", false)
  .option("-f, --full", "Récupère l'intégralité des données disponibles via l'API Deca", false)
  .action(createJobAction("hydrate:contrats-deca-raw"));

program
  .command("update:organismes-deca-transmitter")
  .description("Mise a jour des effectifs DECA désynchronisé")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("update:organismes-deca-transmitter"));

program
  .command("dev:generate-open-api")
  .description("Création/maj du fichier open-api.json")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("dev:generate-open-api"));

/**
 * Job de remplissage des organismes en allant ajouter / maj aux organismes existants (issus de la transmission)
 * tous les organismes du référentiel
 */
program
  .command("hydrate:organismes")
  .description("Remplissage des organismes du tableau de bord en utilisant le référentiel")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("hydrate:organismes"));

/**
 * Job de remplissage des organismes en allant ajouter / maj aux organismes existants (issus de la transmission)
 * tous les organismes du référentiel
 */
program
  .command("hydrate:organismes-effectifs-count")
  .description("Mise à jour des organismes avec le nombre d'effectifs")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("hydrate:organismes-effectifs-count"));

/**
 * Mise à jour des organismes avec le nombre d'effectifs hierarchisé
 */
program
  .command("hydrate:organismes-effectifs-count-with-hierarchy")
  .description("Mise à jour des organismes avec le nombre d'effectifs hierarchisé")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("hydrate:organismes-effectifs-count-with-hierarchy"));

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
  .action(createJobAction("update:organismes-with-apis"));

program
  .command("hydrate:opcos")
  .description("Remplissage des OPCOs pour les organismes")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("hydrate:opcos"));

/**
 * Job de remplissage & maj des d'organismes / dossiersApprenants pour les réseaux avec le nouveau format
 */
program
  .command("hydrate:reseaux")
  .description("Remplissage des réseaux pour les organismes et dossiersApprenants")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("hydrate:reseaux"));

program
  .command("hydrate:ofa-inconnus")
  .description("Correction de l'enseigne et raison sociale des OFA inconnus via API Entreprise")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("hydrate:ofa-inconnus"));

program
  .command("hydrate:effectifs-computed-organismes-reseaux")
  .description("Mise a jour des valeurs computed des effectifs pour les organismes appartennant à un réseau")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("hydrate:effectifs-computed-organismes-reseaux"));

program
  .command("hydrate:effectifs-computed-organismes-opcos")
  .description("Mise a jour des valeurs computed des effectifs pour les organismes appartennant à un opco")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("hydrate:effectifs-computed-organismes-opcos"));

program
  .command("hydrate:voeux-effectifs-relations")
  .description("Mise a jour des liens entre les voeux et les effectifs")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("hydrate:voeux-effectifs-relations"));

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
 * Job de création d'un utilisateur ERP legacy
 */
program
  .command("create:erp-user-legacy")
  .description("Création d'un utilisateur ERP legacy")
  .requiredOption("--username <string>", "Nom de l'utilisateur")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("create:erp-user-legacy"));

/**
 * Job de génération d'un token de MAJ de mot de passe pour un utilisateur
 */
program
  .command("generate:password-update-token")
  .description("Génération d'un token de MAJ de mot de passe pour un utilisateur")
  .requiredOption("--email <string>", "Email de l'utilisateur")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("generate:password-update-token"));

/**
 * Job de génération d'un token de MAJ de mot de passe pour un utilisateur legacy (ancien modèle)
 */
program
  .command("generate-legacy:password-update-token")
  .description("Génération d'un token de MAJ de mot de passe pour un utilisateur legacy")
  .requiredOption("--username <string>", "username de l'utilisateur")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("generate-legacy:password-update-token"));

/**
 * MAJ de mot de passe pour un utilisateur legacy (ancien modèle) via son token
 *
 * Ne pas transfromer en Job pour ne pas save en clair le password dans la collection de job
 */
program
  .command("update:user-legacy:password")
  .description("Modification du mot de passe d'un utilisateur legacy via son token de MAJ ")
  .requiredOption("--token <string>", "token d'update de password")
  .requiredOption("--password <string>", "nouveau mot de passe")
  .action(async (options) => {
    await updateUserPassword(options);
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
  .action(createJobAction("tmp:users:update-apiSeeders"));

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

/**
 * Job de transformation des rupturants en abandon dans ce statut depuis un nombre de jours donné
 */
program
  .command("fiabilisation:effectifs:transform-rupturants-en-abandons-depuis")
  .description("Transformation des rupturants en abandon dans ce statut depuis un nombre de jours donné")
  .option("--nbJours <number>", "Nombre de jours dans le statut", (n) => parseInt(n, 10), 180)
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("fiabilisation:effectifs:transform-rupturants-en-abandons-depuis"));

/**
 * Job d'affichage des stats fiabilisation
 */
program
  .command("fiabilisation:stats")
  .description("Affichage de stats sur le service")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("fiabilisation:stats"));

program
  .command("send-reminder-emails")
  .description("Envoi des emails de relance")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("send-reminder-emails"));

program
  .command("tmp:patches:update-deca-formation")
  .description("Mise a jour des formations des données DECA")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("tmp:patches:update-deca-formation"));

program
  .command("tmp:patches:update-effectifs-queue-source")
  .description("Mise a jour du chanps source dans les effectifs queue")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("tmp:patches:update-effectifs-queue-source"));

program
  .command("tmp:patches:clean-extra-source-in-effectifs")
  .description("Suppression des sources en trop dans les effectifs (scform et fcamanager) ")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("tmp:patches:clean-extra-source-in-effectifs"));

program
  .command("tmp:patches:update-effectifs-source")
  .description("Mise a jour du chanps source dans les effectifs queue")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("tmp:patches:update-effectifs-source"));

program
  .command("dev:list-http-endpoints")
  .description("Liste les routes du serveur HTTP")
  .action(async () => {
    const server = await createServer();
    listEndpoints(server).map(({ path, methods }: { path: string; methods: string[] }) =>
      console.info(`${methods.join(", ").padStart(20)} ${path}`)
    );
  });

program
  .command("job:run")
  .description("Run a job")
  .requiredOption("-n, --name <string>", "Job name")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(({ name, ...options }) => {
    return createJobAction(name)(options);
  });

export async function startCLI() {
  await program.parseAsync(process.argv);
}
