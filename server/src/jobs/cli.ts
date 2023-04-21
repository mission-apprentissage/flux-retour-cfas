import "@/config";
import { Option, program } from "commander";

import { clear, clearUsers } from "./clear/clear-all";
import { purgeEvents } from "./clear/purge-events";
import { findInvalidDocuments } from "./db/findInvalidDocuments";
import { recreateIndexes } from "./db/recreateIndexes";
import { processEffectifsQueueEndlessly } from "./fiabilisation/dossiersApprenants/process-effectifs-queue";
import { removeDuplicatesEffectifsQueue } from "./fiabilisation/dossiersApprenants/process-effectifs-queue-remove-duplicates";
import { getStats } from "./fiabilisation/stats";
import { buildFiabilisationUaiSiret } from "./fiabilisation/uai-siret/build";
import { updateOrganismesFiabilisationUaiSiret } from "./fiabilisation/uai-siret/update";
import { hydrateEffectifsComputed } from "./hydrate/hydrate-effectifs-computed";
import { hydrateOpenApi } from "./hydrate/open-api/hydrate-open-api";
import { hydrateOrganismesEffectifsCount } from "./hydrate/organismes/hydrate-effectifs_count";
import { hydrateOrganismesFromReferentiel } from "./hydrate/organismes/hydrate-organismes";
import { hydrateOrganismesReferentiel } from "./hydrate/organismes/hydrate-organismes-referentiel";
import { updateOrganismesWithApis } from "./hydrate/organismes/update-organismes-with-apis";
import { hydrateReseaux } from "./hydrate/reseaux/hydrate-reseaux";
import { removeOrganismeAndEffectifs } from "./patches/remove-organisme-effectifs-dossiersApprenants/index";
import { removeOrganismesSansSiretSansEffectifs } from "./patches/remove-organismes-sansSiret-sansEffectifs/index";
import { updateLastTransmissionDateForOrganismes } from "./patches/update-lastTransmissionDates/index";
import { runScript } from "./scriptWrapper";
import { seedPlausibleGoals } from "./seed/plausible/goals";
import { seedSample, seedAdmin } from "./seed/start/index";
import { generateTypes } from "./seed/types/generate-types";
import { createErpUserLegacy } from "./users/create-user";
import {
  generatePasswordUpdateTokenForUser,
  generatePasswordUpdateTokenForUserLegacy,
} from "./users/generate-password-update-token";
import { updateUsersApiSeeders } from "./users/update-apiSeeders";
// import { analyseFiabiliteDossierApprenantsRecus } from "./fiabilisation/dossiersApprenants/analyse-fiabilite-dossiers-apprenants-recus";
import { updateUserPassword } from "./users/update-user-password";

program.configureHelp({
  sortSubcommands: true,
});

program
  .command("indexes:create")
  .description("Creation des indexes mongo")
  .option("-d, --drop", "Supprime les indexes existants avant de les recréer")
  .action(async ({ drop }, options) =>
    runScript(async () => {
      await recreateIndexes({ drop });
    }, options._name)
  );

program
  .command("db:find-invalid-documents")
  .argument("<collectionName>", "collection to search for invalid documents")
  .description("Recherche des documents invalides")
  .action(async (collectionName, _, options) => {
    return runScript(async () => {
      await findInvalidDocuments(collectionName);
    }, options._name);
  });

program
  .command("process:effectifs-queue")
  .description("Process la queue des effectifs")
  .option("--id <string>", "ID de l'effectifQueue à traiter")
  .option("-f, --force", "Force le re-traitement des effectifs déjà traités")
  .action(async ({ id, force }, options) =>
    runScript(async () => {
      await processEffectifsQueueEndlessly({ id, force });
    }, options._name)
  );

program
  .command("process:effectifs-queue:remove-duplicates")
  .description("Process la queue des effectifs")
  .action(async (_, options) =>
    runScript(async () => {
      await removeDuplicatesEffectifsQueue();
    }, options._name)
  );

/**
 * Job (temporaire) de suppression d'un organisme et de ses effectifs
 */
program
  .command("tmp:patches:remove-organisme-effectifs")
  .description("[TEMPORAIRE] Suppression d'un organisme avec ses effectifs")
  .requiredOption("--uai <string>", "Uai de l'organisme")
  .requiredOption("--siret <string>", "Siret de l'organisme")
  .action(async ({ uai, siret }, options) =>
    runScript(async () => {
      return removeOrganismeAndEffectifs({ uai, siret });
    }, options._name)
  );

/**
 * Job (temporaire) de suppression des organismes sans siret & sans effectifs
 */
program
  .command("tmp:patches:remove-organismes-sansSiret-sansEffectifs")
  .description("[TEMPORAIRE] Suppression des organismes sans siret & sans effectifs")
  .action(async (_, options) =>
    runScript(async () => {
      return removeOrganismesSansSiretSansEffectifs();
    }, options._name)
  );

/**
 * Job (temporaire) de MAJ des date de dernières transmission des effectifs
 */
program
  .command("tmp:patches:update-lastTransmissionDate-organismes")
  .description("[TEMPORAIRE] Mise à jour des date de dernières transmissions d'un organisme à partir de ses effectifs")
  .action(async (_, options) =>
    runScript(async () => {
      return updateLastTransmissionDateForOrganismes();
    }, options._name)
  );

/**
 * Job d'initialisation de données de test
 */
program
  .command("seed:sample")
  .description("Seed sample data")
  .action(async (_, options) =>
    runScript(async () => {
      return seedSample();
    }, options._name)
  );

/**
 * Job d'initialisation d'un user admin
 * Va initialiser les roles par défaut en plus
 */
program
  .command("seed:admin")
  .description("Seed user admin")
  .option("-e, --email <string>", "Email de l'utilisateur Admin")
  .action(async ({ email }, options) =>
    runScript(async () => {
      return seedAdmin(email?.toLowerCase());
    }, options._name)
  );

/**
 * Job de seed des goals dans plausible,
 * sur les envs de dev, recette et production
 */
program
  .command("seed:plausible:goals")
  .description("Seed plausible goals")
  .action(async (_, options) =>
    runScript(async () => {
      return seedPlausibleGoals();
    }, options._name)
  );

/**
 * Job de nettoyage de db
 */
program
  .command("clear")
  .description("Clear projet")
  .option("-a, --all", "Tout supprimer")
  .action(({ all }, options) =>
    runScript(async () => {
      return clear({ clearAll: all });
    }, options._name)
  );

program
  .command("clear:users")
  .description("Clear users")
  .action((_, options) =>
    runScript(async () => {
      return clearUsers();
    }, options._name)
  );

program
  .command("hydrate:effectifs-computed")
  .description("Remplissage du champ effectifs._computed avec les attributs des organismes")
  .action(async (_, options) =>
    runScript(async () => {
      return hydrateEffectifsComputed();
    }, options._name)
  );

/**
 * Job de remplissage des organismes du référentiel
 */
program
  .command("hydrate:organismes-referentiel")
  .description("Remplissage des organismes du référentiel")
  .action(async (_, options) =>
    runScript(async () => {
      return hydrateOrganismesReferentiel();
    }, options._name)
  );

program
  .command("hydrate:open-api")
  .description("Création/maj du fichier open-api.json")
  .action(async (_, options) =>
    runScript(async () => {
      return hydrateOpenApi();
    }, options._name)
  );

/**
 * Job de remplissage des organismes en allant ajouter / maj aux organismes existants (issus de la transmission)
 * tous les organismes du référentiel
 */
program
  .command("hydrate:organismes")
  .description("Remplissage des organismes via le référentiel")
  .action(async (_, options) =>
    runScript(async () => {
      return hydrateOrganismesFromReferentiel();
    }, options._name)
  );

/**
 * Job de remplissage des organismes en allant ajouter / maj aux organismes existants (issus de la transmission)
 * tous les organismes du référentiel
 */
program
  .command("hydrate:organismes-effectifs-count")
  .description("Mise à jour des organismes avec le nombre d'effectifs")
  .action(async (_, options) =>
    runScript(async () => {
      return hydrateOrganismesEffectifsCount();
    }, options._name)
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
  .action(async (_, options) =>
    runScript(async () => {
      return updateOrganismesWithApis();
    }, options._name)
  );

/**
 * Job de remplissage & maj des d'organismes / dossiersApprenants pour les réseaux avec le nouveau format
 */
program
  .command("hydrate:reseaux")
  .description("Remplissage des réseaux pour les organismes et dossiersApprenants")
  .action(async (_, options) =>
    runScript(async () => {
      return hydrateReseaux();
    }, options._name)
  );

/**
 * Job de purge des events
 */
program
  .command("purge:events")
  .description("Purge des logs inutiles")
  .option("--nbDaysToKeep <int>", "Nombre de jours à conserver")
  .action(async ({ nbDaysToKeep }, options) =>
    runScript(async () => {
      return purgeEvents(nbDaysToKeep);
    }, options._name)
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
//   .action(async ({ email, prenom, nom }, options) =>
//     runScript(async () => {
//       return createUserAccount({
//         email,
//         prenom,
//         nom,
//       });
//     }, options._name)
//   );

/**
 * Job de création d'un utilisateur ERP legacy
 */
program
  .command("create:erp-user-legacy")
  .description("Création d'un utilisateur ERP legacy")
  .requiredOption("--username <string>", "Nom de l'utilisateur")
  .action(async ({ username }, options) =>
    runScript(async () => {
      return createErpUserLegacy(username);
    }, options._name)
  );

/**
 * Job de génération d'un token de MAJ de mot de passe pour un utilisateur
 */
program
  .command("generate:password-update-token")
  .description("Génération d'un token de MAJ de mot de passe pour un utilisateur")
  .requiredOption("--email <string>", "Email de l'utilisateur")
  .action(async ({ email }, options) =>
    runScript(async () => {
      return generatePasswordUpdateTokenForUser(email);
    }, options._name)
  );

/**
 * Job de génération d'un token de MAJ de mot de passe pour un utilisateur legacy (ancien modèle)
 */
program
  .command("generate-legacy:password-update-token")
  .description("Génération d'un token de MAJ de mot de passe pour un utilisateur legacy")
  .requiredOption("--username <string>", "username de l'utilisateur")
  .action(async ({ username }, options) =>
    runScript(async () => {
      return generatePasswordUpdateTokenForUserLegacy(username);
    }, options._name)
  );

/**
 * Job de de MAJ de mot de passe pour un utilisateur legacy (ancien modèle) via son token
 */
program
  .command("update:user-legacy:password")
  .description("Modification du mot de passe d'un utilisateur legacy via son token de MAJ ")
  .requiredOption("--token <string>", "token d'update de password")
  .requiredOption("--password <string>", "nouveau mot de passe")
  .action(async ({ token, password }, options) =>
    runScript(async () => {
      return updateUserPassword(token, password);
    }, options._name)
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
  .action(async ({ mode }, options) =>
    runScript(async () => {
      return updateUsersApiSeeders(mode);
    }, options._name)
  );

/**
 * Job de lancement des scripts de fiabilisation des couples UAI SIRET
 */
program
  .command("fiabilisation:uai-siret:run")
  .description("Lancement des scripts de fiabilisation des couples UAI SIRET")
  .action((_, options) =>
    runScript(async () => {
      // On lance séquentiellement 2 fois de suite la construction (build) de la collection fiabilisation suivi de la MAJ des données liées (apply)
      // Nécessaire pour le bon fonctionnement de l'algo
      await buildFiabilisationUaiSiret();
      await updateOrganismesFiabilisationUaiSiret();
      const buildResults = await buildFiabilisationUaiSiret();
      const updateResults = await updateOrganismesFiabilisationUaiSiret();

      return { buildResults, updateResults };
    }, options._name)
  );

/**
 * Job d'analyse de la fiabilité des dossiersApprenants reçus
 */
// program
//   .command("fiabilisation:analyse:dossiersApprenants-recus")
//   .description("Analyse de la fiabilité des dossiersApprenants reçus")
//   .action((_, options) =>
//     runScript(async () => {
//       return analyseFiabiliteDossierApprenantsRecus();
//     }, options._name)
//   );

/**
 * Job d'affichage des stats fiabilisation
 */
program
  .command("fiabilisation:stats")
  .description("Affichage de stats sur le service")
  .action((_, options) =>
    runScript(async () => {
      await getStats();
    }, options._name)
  );

/**
 * Job d'affichage des stats fiabilisation
 */
program
  .command("dev:generate-ts-types")
  .description("Generation des types TS à partir des schemas de la base de données")
  .action((_, options) =>
    runScript(async () => {
      await generateTypes();
    }, options._name)
  );

program.parse(process.argv);
