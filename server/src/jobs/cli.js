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

cli
  .command("refacto-migration-organisme-unique")
  .description("Migration d'un cfa vers organismes")
  .requiredOption("-u, --uai <string>", "Uai du cfa à migrer")
  .action(async ({ uai }) => {
    runScript(async () => {
      return migrateSingleCfaToOrganisme(uai);
    }, "refacto-migration-cfas-to-organismes-unique");
  });

cli
  .command("refacto-migration-organisme-fiabilite-cfa")
  .description("Analyse de la fiabilité d'un cfa avant migration")
  .requiredOption("-u, --uai <string>", "Uai du cfa à migrer")
  .action(async ({ uai }) => {
    runScript(async () => {
      return analyseFiabilisationCfa(uai);
    }, "refacto-migration-cfas-to-organismes-fiabilite-cfa");
  });

cli
  .command("refacto-migration-organismes-fiabilite")
  .description("Analyse de la fiabilité des cfas avant migration")
  .action(async () => {
    runScript(async () => {
      return analyseFiabilisationCfas();
    }, "refacto-migration-cfas-to-organismes-fiabilite-cfa");
  });

cli
  .command("refacto-migration-dossiersApprenants")
  .description("Migration d'un cfa vers organismes")
  .option("--sample <int>", "Nb de dossiers à traiter")
  .action(async ({ sample }) => {
    runScript(async () => {
      return migrateDossiersApprenantsToDossiersApprenantsMigration(sample);
    }, "refacto-migration-dossiersApprenants");
  });

cli.parse(process.argv);
