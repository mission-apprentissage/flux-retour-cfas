import "dotenv/config.js";
import { Option, program as cli } from "commander";
import { runScript } from "./scriptWrapper.js";
import { seedSample, seedAdmin, seedRoles } from "./seed/start/index.js";
import { clear, clearRoles, clearUsers } from "./clear/clear-all.js";
import { hydrateArchivesDossiersApprenantsAndEffectifs } from "./hydrate/archive-dossiers-apprenants/hydrate-archive-dossiersApprenants.js";
import { purgeEvents } from "./clear/purge-events.js";
import { createUserAccount } from "./users/create-user.js";
import {
  generatePasswordUpdateTokenForUser,
  generatePasswordUpdateTokenForUserLegacy,
} from "./users/generate-password-update-token.js";
import { hydrateOrganismesFromReferentiel } from "./hydrate/organismes/hydrate-organismes.js";
import { hydrateReseaux } from "./hydrate/reseaux/hydrate-reseaux.js";
import { updateUsersApiSeeders } from "./users/update-apiSeeders.js";
import { hydrateOrganismesReferentiel } from "./hydrate/organismes/hydrate-organismes-referentiel.js";
import { updateOrganismesWithApis } from "./hydrate/organismes/update-organismes-with-apis.js";
import { removeOrganismesSansSiretSansEffectifs } from "./patches/remove-organismes-sansSiret-sansEffectifs/index.js";
import { updateLastTransmissionDateForOrganismes } from "./patches/update-lastTransmissionDates/index.js";

/**
 * Job (temporaire) de suppression des organismes sans siret & sans effectifs
 */
cli
  .command("patches:remove-organismes-sansSiret-sansEffectifs")
  .description("Suppression des organismes sans siret & sans effectifs")
  .action(async () => {
    runScript(async () => {
      return removeOrganismesSansSiretSansEffectifs();
    }, "remove-organismes-sansSiret-sansEffectifs");
  });

/**
 * Job (temporaire) de MAJ des date de dernières transmission des effectifs
 */
cli
  .command("patches:update-lastTransmissionDate-organismes")
  .description("Suppression des organismes sans siret & sans effectifs")
  .action(async () => {
    runScript(async () => {
      return updateLastTransmissionDateForOrganismes();
    }, "update-lastTransmissionDate-organismes");
  });

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

cli
  .command("clear:users")
  .description("Clear users")
  .action(() => {
    runScript(async () => {
      return clearUsers();
    }, "Clear");
  });

cli
  .command("clear:roles")
  .description("Clear roles")
  .action(() => {
    runScript(async () => {
      return clearRoles();
    }, "Clear");
  });

/**
 * Job de remplissage des organismes du référentiel
 */
cli
  .command("hydrate:organismes-referentiel")
  .description("Remplissage des organismes du référentiel")
  .action(async () => {
    runScript(async () => {
      return hydrateOrganismesReferentiel();
    }, "hydrate-organismes-referentiel");
  });

/**
 * Job de remplissage des organismes en allant ajouter / maj aux organismes existants (issus de la transmission)
 * tous les organismes du référentiel
 */
cli
  .command("hydrate:organismes")
  .description("Remplissage des organismes via le référentiel")
  .action(async () => {
    runScript(async () => {
      return hydrateOrganismesFromReferentiel();
    }, "hydrate-organismes");
  });

/**
 * Job de mise à jour des organismes en allant appeler des API externes pour remplir
 * - Les informations liés au SIRET (API Entreprise)
 * - L'arbre des formations (API Catalogue)
 * - Les métiers liés (API LBA)
 */
cli
  .command("update:organismes-with-apis")
  .description("Mise à jour des organismes via API externes")
  .action(async () => {
    runScript(async () => {
      return updateOrganismesWithApis();
    }, "update-organismes-with-apis");
  });

/**
 * Job de remplissage & maj des d'organismes / dossiersApprenants pour les réseaux avec le nouveau format
 */
cli
  .command("hydrate:reseaux")
  .description("Remplissage des réseaux pour les organismes et dossiersApprenants")
  .action(async () => {
    runScript(async () => {
      return hydrateReseaux();
    }, "hydrate-reseaux");
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
 * TEMPORAIRE
 * Job de mise à jour des utilisateurs fournisseurs de données
 * Va modifier leur permission en mode actif / inactif pour temporairement bloquer l'envoi des données
 */
cli
  .command("users:update-apiSeeders")
  .description("Modification des utilisateurs fournisseurs de données")
  .addOption(new Option("--mode <mode>", "Mode de mise à jour").choices(["active", "inactive"]).makeOptionMandatory())
  .action(async ({ mode }) => {
    runScript(async () => {
      return updateUsersApiSeeders(mode);
    }, "users:update-apiSeeders");
  });

cli;

cli.parse(process.argv);
