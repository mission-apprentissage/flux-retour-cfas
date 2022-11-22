import "dotenv/config.js";
import { program as cli } from "commander";
import { runScript } from "./scriptWrapper.js";
import { seed } from "./seed/start/index.js";
import { clear } from "./clear/index.js";
import { migrateCfasToOrganismes } from "./refacto-migration/organismes.js";

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

cli.parse(process.argv);
