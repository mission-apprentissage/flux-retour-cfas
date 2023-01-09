import "dotenv/config.js";
import { program as cli } from "commander";
import { runScript } from "./scriptWrapper.js";
import { seedSample, seedAdmin, seedRoles } from "./seed/start/index.js";
import { clear } from "./clear/clear-all.js";
import { hydrateEffectifsApprenants } from "./hydrate/effectifs-apprenants/hydrate-effectifsApprenants.js";
import { hydrateArchivesDossiersApprenantsAndEffectifs } from "./hydrate/archive-dossiers-apprenants/hydrate-archive-dossiersApprenants.js";
import { purgeEvents } from "./clear/purge-events.js";
// import { seedWithSample } from "./seed/samples/seedSample.js";
import { createUserAccount } from "./users/create-user.js";
import {
  generatePasswordUpdateTokenForUser,
  generatePasswordUpdateTokenForUserLegacy,
} from "./users/generate-password-update-token.js";
import { hydrateOrganismesAndFormations } from "./hydrate/organismes/hydrate-organismes-and-formations.js";
import { hydrateReseauxNewFormat } from "./hydrate/reseaux/hydrate-reseaux-new-format.js";
import { warmEffectifsCache } from "./warm-effectifs-cache/index.js";
import { hydrateRefreshFormations } from "./hydrate/refresh-formations/hydrate-refresh-formations.js";
import { hydrateFormationsFromDossiersApprenants } from "./hydrate/_toRemove/formations/hydrate-formations-from-dossiersApprenants.js";

/**
 * Job d'initialisation de données de test
 */
cli
  .command("seed")
  .description("Seed global data")
  .option("-e, --email <string>", "Email de l'utilisateur Admin")
  .action(async ({ email }) => {
    runScript(async () => {
      await seedRoles();
      return seedAdmin({ adminEmail: email?.toLowerCase() });
    }, "Seed-admin");
  });

/**
 * Job d'initialisation de données de test
 */
cli
  .command("seed:sample")
  .description("Seed sample data")
  .action(async () => {
    runScript(async () => {
      return seedSample();
    }, "Seed sample");
  });

/**
 * Job d'initialisation des roles
 * Pas nécessaire de l'exécuter si on créé un admin
 */
cli
  .command("seed:roles")
  .description("Seed roles")
  .action(async () => {
    runScript(async () => {
      return seedRoles();
    }, "Seed-roles");
  });

/**
 * Job d'initialisation d'un user admin
 * Va initialiser les roles par défaut en plus
 */
cli
  .command("seed:admin")
  .description("Seed user admin")
  .option("-e, --email <string>", "Email de l'utilisateur Admin")
  .action(async ({ email }) => {
    runScript(async () => {
      return seedAdmin({ adminEmail: email?.toLowerCase() });
    }, "Seed-admin");
  });

/**
 * Job d'initialisation projet avec des données d'exemple
 */
// cli
//   .command("seed:sample")
//   .description("Seed projet avec des données d'exemple")
//   .option("--random", "Indique si le seed doit générer des données aléatoires")
//   .option("--nbDossiers <int>", "Indique le nombre de statuts à générer si mode random")
//   .action(async ({ random, nbDossiers }) => {
//     runScript(async () => {
//       return seedWithSample(random, nbDossiers);
//     }, "Seed-sample");
//   });

/**
 * Job de nettoyage de db
 */
cli
  .command("clear")
  .description("Clear projet")
  .option("-a, --all", "Tout supprimer")
  .action(({ all }) => {
    runScript(async () => {
      return clear({ clearAll: all });
    }, "Clear");
  });

/**
 * Job de remplissage des organismes et des formations
 */
cli
  .command("hydrate:organismes-and-formations")
  .description("Remplissage des organismes et des formations")
  .action(async () => {
    runScript(async () => {
      return hydrateOrganismesAndFormations();
    }, "hydrate-organismes-and-formations");
  });

/**
 *  TODO ?
 * Job de rafraichissement des formations déja présentes en base
 */
cli
  .command("hydrate:refresh-formations")
  .description("Mise à jour des formations")
  .action(async () => {
    runScript(async () => {
      return hydrateRefreshFormations();
    }, "hydrate-refresh-formations");
  });

/**
 * Job de remplissage des organismes et des formations
 */
cli
  .command("hydrate:formations-from-dossiersApprenants")
  .description("Remplissage des formations depuis les dossiersApprenants")
  .action(async () => {
    runScript(async () => {
      return hydrateFormationsFromDossiersApprenants();
    }, "hydrate-formations-from-dossiersApprenants");
  });

/**
 * Job de remplissage & maj des d'organismes / dossiersApprenants pour les réseaux avec le nouveau format
 */
cli
  .command("hydrate:reseaux-newFormat")
  .description("MAJ des réseaux nouveau format pour les organismes et dossiersApprenants")
  .action(async () => {
    runScript(async () => {
      return hydrateReseauxNewFormat();
    }, "hydrate-reseaux-newFormat");
  });

/**
 * Job d'archivage des dossiers apprenants et des effectifs
 */
cli
  .command("archive:dossiersApprenantsEffectifs")
  .description("Archivage des dossiers apprenants")
  .option("--limit <int>", "Année limite d'archivage")
  .action(async ({ limit }) => {
    runScript(async () => {
      return hydrateArchivesDossiersApprenantsAndEffectifs(limit);
    }, "hydrate-archive-dossiersApprenants-effectifs");
  });

/**
 * Job de remplissage des effectifs apprenants
 */
cli
  .command("hydrate:effectifsApprenants")
  .description("Remplissage des effectifs apprenants")
  .action(async () => {
    runScript(async ({ effectifs }) => {
      return hydrateEffectifsApprenants(effectifs);
    }, "hydrate-effectifsApprenants");
  });

/**
 * Job de purge des events
 */
cli
  .command("purge:events")
  .description("Purge des logs inutiles")
  .option("--nbDaysToKeep <int>", "Nombre de jours à conserver")
  .action(async ({ nbDaysToKeep }) => {
    runScript(async () => {
      return purgeEvents(nbDaysToKeep);
    }, "purge-events");
  });

/**
 * Job de création d'un utilisateur
 */
cli
  .command("create:user")
  .description("Création d'un utilisateur")
  .requiredOption("--email <string>", "Email de l'utilisateur")
  .option("--prenom <string>", "Prénom de l'utilisateur")
  .option("--nom <string>", "Nom de l'utilisateur")
  .option("--isAdmin <bool>", "Indique s'il est administrateur")
  .option("--isCrossOrganismes <bool>", "Indique s'il est cross organismes")
  .action(async ({ email, prenom, nom, isAdmin, isCrossOrganismes }) => {
    runScript(async () => {
      return createUserAccount({
        email,
        prenom,
        nom,
        permissions: { is_admin: isAdmin, is_cross_organismes: isCrossOrganismes },
      });
    }, "create-user");
  });

/**
 * Job de génération d'un token de MAJ de mot de passe pour un utilisateur
 */
cli
  .command("generate:password-update-token")
  .description("Génération d'un token de MAJ de mot de passe pour un utilisateur")
  .requiredOption("--email <string>", "Email de l'utilisateur")
  .action(async ({ email }) => {
    runScript(async () => {
      return generatePasswordUpdateTokenForUser(email);
    }, "generate-password-update-token");
  });

/**
 * Job de génération d'un token de MAJ de mot de passe pour un utilisateur legacy (ancien modèle)
 */
cli
  .command("generate-legacy:password-update-token")
  .description("Génération d'un token de MAJ de mot de passe pour un utilisateur legacy")
  .requiredOption("--username <string>", "username de l'utilisateur")
  .action(async ({ username }) => {
    runScript(async () => {
      return generatePasswordUpdateTokenForUserLegacy(username);
    }, "generate-password-update-token-legacy");
  });

/**
 * Job de warm up du cache des requêtes des calcul d'effectifs
 */
cli
  .command("cache:warmup")
  .description("Appel des requêtes des calcul d'effectifs pour warmup du cache")
  .action(async () => {
    runScript(async () => {
      return warmEffectifsCache();
    }, "cache-warmup");
  });

cli.parse(process.argv);
