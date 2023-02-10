import "dotenv/config.js";
import { program as cli } from "commander";
import { runScript } from "./scriptWrapper.js";
import { analyseFiabiliteDossierApprenantsRecus } from "./fiabilisation/dossiersApprenants/analyse-fiabilite-dossiers-apprenants-recus.js";
import { buildFiabilisationUaiSiret } from "./fiabilisation/uai-siret/build-fiabilisation/index.js";
import { applyFiabilisationUaiSiret } from "./fiabilisation/uai-siret/apply-fiabilisation/index.js";

// /**
//  * Job de suppression des organismes non fiables et déplacement des contributeurs & effectifs liés
//  */
// cli
//   .command("clean:organismes-non-fiables")
//   .description("Suppression des organismes non fiables et déplacement des contributeurs & effectifs liés")
//   .action(() => {
//     runScript(async () => {
//       return cleanOrganismesNonFiables();
//     }, "fiabilisation-clean-organismes-non-fiables");
//   });

/**
 * Job de création de la collection fiabilisation UAI SIRET
 */
cli
  .command("build:fiabilisation-uai-siret")
  .description("Création de la collection pour fiabilisation des UAI SIRET")
  .action(() => {
    runScript(async () => {
      return buildFiabilisationUaiSiret();
    }, "build-fiabilisation-uai-siret");
  });

/**
 * Job d'application de la fiabilisation UAI SIRET
 */
cli
  .command("apply:fiabilisation-uai-siret")
  .description("Application du mapping de fiabilisation des UAI SIRET")
  .action(() => {
    runScript(async () => {
      return applyFiabilisationUaiSiret();
    }, "apply-fiabilisation-uai-siret");
  });

/**
 * Job d'analyse de la fiabilité des dossiersApprenants reçus
 */
cli
  .command("analyse:dossiersApprenants-recus")
  .description("Analyse de la fiabilité des dossiersApprenants reçus")
  .action(() => {
    runScript(async () => {
      return analyseFiabiliteDossierApprenantsRecus();
    }, "analyse-dossiersApprenants-recus");
  });

cli.parse(process.argv);
