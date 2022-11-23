import "dotenv/config.js";
import { program as cli } from "commander";
import { runScript } from "./scriptWrapper.js";
import { seed } from "./seed/start/index.js";
import { clear } from "./clear/index.js";
import {
  migrateCfasToOrganismes,
  migrateSingleCfaToOrganisme,
} from "./patches/refacto-migration/organismes/organismes.migration.js";
import {
  analyseFiabilisationCfa,
  analyseFiabilisationCfas,
} from "./patches/refacto-migration/organismes/organismes.init.migration.js";
import { migrateDossiersApprenantsToDossiersApprenantsMigration } from "./patches/refacto-migration/dossiersApprenants/dossiersApprenants.migration.js";
import { hydrateOrganismesFromReseaux } from "./hydrate/reseaux/hydrate-organismes-reseaux.js";
import { hydrateReferentiel } from "./hydrate/referentiel/hydrate-referentiel.js";

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
 * Job de migration de la collection cfas vers la collection organismes
 */
cli
  .command("refacto-migration-organismes")
  .description("Migration cfas vers organismes")
  .action(() => {
    runScript(async () => {
      return migrateCfasToOrganismes();
    }, "refacto-migration-cfas-to-organismes");
  });

/**
 * Job de migration d'un cfa vers un organisme unique
 */
cli
  .command("refacto-migration-organisme-unique")
  .description("Migration d'un cfa vers organismes")
  .requiredOption("-u, --uai <string>", "Uai du cfa à migrer")
  .action(async ({ uai }) => {
    runScript(async () => {
      return migrateSingleCfaToOrganisme(uai);
    }, "refacto-migration-cfas-to-organismes-unique");
  });

/**
 * Job d'analyse de la fiabilité d'un cfa en vue de migration organisme
 */
cli
  .command("refacto-migration-organisme-fiabilite-cfa")
  .description("Analyse de la fiabilité d'un cfa avant migration")
  .requiredOption("-u, --uai <string>", "Uai du cfa à migrer")
  .action(async ({ uai }) => {
    runScript(async () => {
      return analyseFiabilisationCfa(uai);
    }, "refacto-migration-cfas-to-organismes-fiabilite-cfa");
  });

/**
 * Job d'analyse de la fiabilité des cfas en vue de migration vers organismes
 */
cli
  .command("refacto-migration-organismes-fiabilite")
  .description("Analyse de la fiabilité des cfas avant migration")
  .action(async () => {
    runScript(async () => {
      return analyseFiabilisationCfas();
    }, "refacto-migration-cfas-to-organismes-fiabilite-cfa");
  });

/**
 * Job de migration des dossiersApprenants
 */
cli
  .command("refacto-migration-dossiersApprenants")
  .description("Migration d'un cfa vers organismes")
  .option("--sampleNbUais <int>", "Nb de dossiers à traiter")
  .action(async ({ sampleNbUais }) => {
    runScript(async () => {
      return migrateDossiersApprenantsToDossiersApprenantsMigration(sampleNbUais);
    }, "refacto-migration-dossiersApprenants");
  });

/**
 * Job de remplissage & maj des d'organismes depuis les fichiers réseaux
 */
cli
  .command("hydrate-organismes-reseaux")
  .description("Remplissage des organismes depuis les réseaux")
  .action(async () => {
    runScript(async ({ ovhStorage }) => {
      return hydrateOrganismesFromReseaux(ovhStorage);
    }, "hydrate-organismes-reseaux");
  });

/**
 * Job de remplissage & maj des organismes depuis le référentiel
 */
cli
  .command("hydrate-referentiel")
  .description("Remplissage des organismes depuis le référentiel")
  .action(async () => {
    runScript(async () => {
      return hydrateReferentiel();
    }, "hydrate-referentiel");
  });

cli.parse(process.argv);
