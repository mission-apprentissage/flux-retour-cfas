import "dotenv/config.js";
import { program as cli } from "commander";
import { runScript } from "./scriptWrapper.js";
import { seed } from "./seed/start/index.js";
import { clear } from "./clear/clear-all.js";
import { hydrateFromReseaux } from "./hydrate/reseaux/hydrate-reseaux.js";
import { hydrateEffectifsApprenants } from "./hydrate/effectifs-apprenants/hydrate-effectifsApprenants.js";
import { hydrateRncpCodes } from "./hydrate/rncp/hydrate-rncp.js";
import { hydrateArchivesDossiersApprenants } from "./hydrate/archive-dossiers-apprenants/hydrate-archive-dossiersApprenants.js";
import { purgeEvents } from "./clear/purge-events.js";
import { seedWithSample } from "./seed/samples/seedSample.js";
import { hydrateFormations } from "./hydrate/formations/hydrate-formations.js";
import { hydrateReseauExcellencePro } from "./hydrate/reseaux/hydrate-reseau-excellence-pro.js";
import { createUserAccount } from "./users/create-user.js";
import {
  generatePasswordUpdateTokenForUser,
  generatePasswordUpdateTokenForUserLegacy,
} from "./users/generate-password-update-token.js";
import { hydrateOrganismes } from "./hydrate/organismes/hydrate-organismes.js";
import { hydrateOrganismesReferentiel } from "./hydrate/organismes/hydrate-organismes-referentiel.js";

/**
 * Job d'initialisation projet
 */
cli
  .command("seed")
  .description("Seed projet")
  .option("-e, --email <string>", "Email de l'utilisateur Admin")
  .action(async ({ email }) => {
    runScript(async () => {
      return seed({ adminEmail: email?.toLowerCase() });
    }, "Seed");
  });

/**
 * Job d'initialisation projet avec des données d'exemple
 */
cli
  .command("seed:sample")
  .description("Seed projet avec des données d'exemple")
  .option("-r, --random", "Indique si le seed doit générer des données aléatoires")
  .action(async ({ random }) => {
    runScript(async ({ dossiersApprenants }) => {
      return seedWithSample(dossiersApprenants, random);
    }, "Seed-sample");
  });

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
 * Job de remplissage & maj des d'organismes et des dossiersApprenants depuis les fichiers réseaux
 */
cli
  .command("hydrate:reseaux")
  .description("Remplissage des organismes et dossiersApprenants depuis les réseaux")
  .action(async () => {
    runScript(async () => {
      return hydrateFromReseaux();
    }, "hydrate-reseaux");
  });

/**
 * Job de remplissage & maj des d'organismes pour le réseau excellencePro
 */
// TODO Update le csv pour gérer le réseau
cli
  .command("hydrate:reseau-excellencePro")
  .description("MAJ des organismes pour le réseau excellencePro")
  .action(async () => {
    runScript(async () => {
      return hydrateReseauExcellencePro();
    }, "hydrate-reseau-excellencePro");
  });

/**
 * Job d'archivage des dossiers apprenants
 */
cli
  .command("archive:dossiersApprenants")
  .description("Archivage des dossiers apprenants")
  .option("--limit <int>", "Année limite d'archivage")
  .action(async ({ limit }) => {
    runScript(async () => {
      return hydrateArchivesDossiersApprenants(limit);
    }, "hydrate-archive-dossiersApprenants");
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
 * Job de remplissage des codes rncp
 // TODO : voir coté métier si toujours utile si on passe le RNCP en obligatoire ?
 */
cli
  .command("hydrate:rncp")
  .description("Remplissage des codes rncp des dossiersApprenants")
  .action(async () => {
    runScript(async () => {
      return hydrateRncpCodes();
    }, "hydrate-rncp");
  });

/**
 * Job de remplissage des formations
 */
cli
  .command("hydrate:formations")
  .description("Remplissage des formations")
  .action(async () => {
    runScript(async () => {
      return hydrateFormations();
    }, "hydrate-formations");
  });

/**
 * Job de remplissage des organismes
 */
cli
  .command("hydrate:organismes")
  .description("Remplissage des organismes")
  .action(async () => {
    runScript(async () => {
      return hydrateOrganismes();
    }, "hydrate-organismes");
  });

/**
 * Job de remplissage & maj des organismes depuis le référentiel
 */
cli
  .command("hydrate:organismes-referentiel")
  .description("Remplissage des organismes depuis le référentiel")
  .action(async () => {
    runScript(async () => {
      return hydrateOrganismesReferentiel();
    }, "hydrate-organismes+referentiel");
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

cli.parse(process.argv);
