import "dotenv/config.js";
import { program as cli } from "commander";
import { runScript } from "./scriptWrapper.js";
import {
  migrateCfasToOrganismes,
  migrateSingleCfaToOrganisme,
} from "./patches/refacto-migration/organismes/organismes.migration.js";
import {
  analyseFiabilisationCfa,
  analyseFiabilisationCfas,
} from "./patches/refacto-migration/organismes/organismes.init.migration.js";
import { migrateDossiersApprenantsToDossiersApprenantsMigration } from "./patches/refacto-migration/dossiersApprenants/dossiersApprenants.migration.js";
import { migrateUsersToArchives } from "./patches/refacto-migration/users/users.archive.migration.js";
import { cleanUserValidation } from "./patches/refacto-migration/users/users.clean.migration.js";

// TEMP CLI Jobs
// TODO Remove after big refacto migration

/**
 * Job de migration de la collection cfas vers la collection organismes
 */
cli
  .command("migrate:organismes")
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
  .command("migrate:organisme")
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
  .command("migrate:organisme-fiabilite")
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
  .command("migrate:organismes-fiabilite")
  .description("Analyse de la fiabilité des cfas avant migration")
  .action(async () => {
    runScript(async () => {
      return analyseFiabilisationCfas();
    }, "refacto-migration-cfas-to-organismes-fiabilite-cfa");
  });

/**
 * Job de migration des dossiersApprenants
 * ne prends en compte que les dossiersApprenants ayant un id_erp_apprenant non vide / non null
 */
cli
  .command("migrate:dossiersApprenants")
  .description("Migration des dossiersApprenants vers la collection dossiersApprenantsMigration")
  .option("--sampleNbUais <int>", "Nb de dossiers à traiter")
  .option("--uai <string>", "UAI spécifique à traiter")
  .option("--numRegion <string>", "Région spécifique à traiter")
  .option("--numAcademie <string>", "Académie spécifique à traiter")
  .action(async ({ sampleNbUais, uai, numRegion, numAcademie }) => {
    runScript(async () => {
      return migrateDossiersApprenantsToDossiersApprenantsMigration(sampleNbUais, uai, numRegion, numAcademie);
    }, "refacto-migration-dossiersApprenants");
  });

/**
 * Job d'archive des users non ERPs
 */
cli
  .command("archive:users")
  .description("Archive des users non erps")
  .action(async () => {
    runScript(async () => {
      return migrateUsersToArchives();
    }, "refacto-migration-archive-users");
  });

/**
 * Job de nettoyage des users pour passer la validation
 */
cli
  .command("clean:users")
  .description("Nettoyage des users pour passer la validation")
  .action(async () => {
    runScript(async () => {
      return cleanUserValidation();
    }, "refacto-migration-clean-users");
  });

cli.parse(process.argv);
