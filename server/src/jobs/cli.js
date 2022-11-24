import "dotenv/config.js";
import { program as cli } from "commander";
import { runScript } from "./scriptWrapper.js";
import { seed } from "./seed/start/index.js";
import { clear } from "./clear/index.js";
import { hydrateFromReseaux } from "./hydrate/reseaux/hydrate-reseaux.js";
import { hydrateReferentiel } from "./hydrate/referentiel/hydrate-referentiel.js";
import { hydrateEffectifsApprenants } from "./hydrate/effectifs-apprenants/hydrate-effectifsApprenants.js";
import { hydrateRncpCodes } from "./hydrate/rncp/hydrate-rncp.js";
import { hydrateArchivesDossiersApprenants } from "./hydrate/archive-dossiers-apprenants/hydrate-archive-dossiersApprenants.js";

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
 * Job de netoyage de db
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
    runScript(async ({ ovhStorage }) => {
      return hydrateFromReseaux(ovhStorage);
    }, "hydrate-organismes-reseaux");
  });

/**
 * Job de remplissage & maj des organismes depuis le référentiel
 */
cli
  .command("hydrate:referentiel")
  .description("Remplissage des organismes depuis le référentiel")
  .action(async () => {
    runScript(async () => {
      return hydrateReferentiel();
    }, "hydrate-referentiel");
  });

/**
 * Job de remplissage des archives des anciens dossiers apprenants
 */
cli
  .command("hydrate:archives-dossiersApprenants")
  .description("Archivage des anciens dossiers apprenants")
  .option("--limit <int>", "Année limite d'archivage")
  .action(async ({ limit }) => {
    runScript(async ({ archiveDossiersApprenants }) => {
      return hydrateArchivesDossiersApprenants(archiveDossiersApprenants, limit);
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

cli.parse(process.argv);
