import "dotenv/config";
import { program as cli } from "commander";
import { runScript } from "./scriptWrapper.js";
import { analyseFiabiliteDossierApprenantsRecus } from "./fiabilisation/dossiersApprenants/analyse-fiabilite-dossiers-apprenants-recus.js";
import { buildFiabilisationUaiSiret } from "./fiabilisation/uai-siret/build-fiabilisation/index.js";
import { applyFiabilisationUaiSiret } from "./fiabilisation/uai-siret/apply-fiabilisation/index.js";

/**
 * Job de création de la collection fiabilisation UAI SIRET
 */
cli
  .command("build:fiabilisation-uai-siret")
  .description("Création de la collection pour fiabilisation des UAI SIRET")
  .action((_, options) =>
    runScript(async () => {
      // On lance séquentiellement 2 fois la construction de la table de fiabilisation - nécessaire pour prendre en compte tous les cas
      await buildFiabilisationUaiSiret();
      await buildFiabilisationUaiSiret();
    }, options._name)
  );

/**
 * Job d'application de la fiabilisation UAI SIRET
 */
cli
  .command("apply:fiabilisation-uai-siret")
  .description("Application du mapping de fiabilisation des UAI SIRET")
  .action((_, options) =>
    runScript(async () => {
      return applyFiabilisationUaiSiret();
    }, options._name)
  );

/**
 * Job d'analyse de la fiabilité des dossiersApprenants reçus
 */
cli
  .command("analyse:dossiersApprenants-recus")
  .description("Analyse de la fiabilité des dossiersApprenants reçus")
  .action((_, options) =>
    runScript(async () => {
      return analyseFiabiliteDossierApprenantsRecus();
    }, options._name)
  );

cli.parse(process.argv);
