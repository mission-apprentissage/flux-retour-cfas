import "dotenv/config.js";
import { program as cli } from "commander";
import { runScript } from "./scriptWrapper.js";
import { identifyNetworkReferenceDuplicates } from "./fiabilisation/duplicates/identify-network-duplicates/index.js";
import { identifyUaisDuplicates } from "./fiabilisation/duplicates/dossiersApprenants-duplicates-uais/identify.js";
import { cleanUaisDuplicates } from "./fiabilisation/duplicates/dossiersApprenants-duplicates-uais/clean.js";
import { identifyCfdDuplicates } from "./fiabilisation/duplicates/dossiersApprenants-duplicates-cfd/identify.js";
import { removeDossierApprenantsDuplicates } from "./fiabilisation/duplicates/dossiersApprenants-duplicates/remove-duplicates.js";
import { analyseFiabiliteDossierApprenantsRecus } from "./fiabilisation/dossiersApprenants/analyse-fiabilite-dossiers-apprenants-recus.js";
import { updateFiabilisationUaiSiretAFiabiliser } from "./fiabilisation/uai-siret/update-fiabilisation-type/index.js";
import { buildFiabilisationUaiSiret } from "./fiabilisation/uai-siret/build-fiabilisation/index.js";
import { applyFiabilisationUaiSiret } from "./fiabilisation/uai-siret/apply-fiabilisation/index.js";
import { identifySirenDuplicates } from "./fiabilisation/duplicates/dossiersApprenants-duplicates-siren/identify.js";

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
 * Job d'initialisation des valeurs defaut pour la fiabilisation
 * Job temporaire nécessaire suite à la modification du modèle
 */
cli
  .command("migration:fiabilisation-default-values")
  .description(
    "MAJ des entrées fiabilisationUaiSiretDb avec le type = A FIABILISER et des statuts de fiabilisation des organismes"
  )
  .action(() => {
    runScript(async () => {
      return updateFiabilisationUaiSiretAFiabiliser();
    }, "fiabilisation-update-fiabilisation-type-aFiabiliser");
  });

/**
 * Job d'identification des doublons dans les fichiers CSV de réseaux
 */
cli
  .command("duplicates:identify-networks")
  .description("Identification des doublons dans les fichiers CSV de réseaux")
  .action(() => {
    runScript(async () => {
      return identifyNetworkReferenceDuplicates();
    }, "duplicates-identify-networks");
  });

/**
 * Job d'identification des doublons d'uais sur les dossiersApprenants
 */
cli
  .command("duplicates:identify-uais")
  .description("Identification des doublons d'uais sur les dossiersApprenants")
  .action(() => {
    runScript(async ({ effectifs }) => {
      return identifyUaisDuplicates(effectifs);
    }, "duplicates-identify-uais");
  });

/**
 * Job de suppression des doublons d'uais sur les dossiersApprenants
 */
cli
  .command("duplicates:clean-uais")
  .description("Suppression des doublons d'uais sur les dossiersApprenants")
  .action(() => {
    runScript(async () => {
      return cleanUaisDuplicates();
    }, "duplicates-clean-uais");
  });

/**
 * Job d'identification des doublons de cfd sur les dossiersApprenants
 */
cli
  .command("duplicates:identify-cfd")
  .description("Identification des doublons de cfd sur les dossiersApprenants")
  .action(() => {
    runScript(async ({ effectifs }) => {
      return identifyCfdDuplicates(effectifs);
    }, "duplicates-identify-cfd");
  });

/**
 * Job d'identification des doublons par siren sur les dossiersApprenants
 */
cli
  .command("duplicates:identify-siren")
  .description("Identification des doublons par siren sur les dossiersApprenants")
  .action(() => {
    runScript(async ({ effectifs }) => {
      return identifySirenDuplicates(effectifs);
    }, "duplicates-identify-siren");
  });

/**
 * Job de suppression des doublons sur les dossiersApprenants
 */
cli
  .command("duplicates:remove")
  .description("Identification des doublons de cfd sur les dossiersApprenants")
  .requiredOption("--duplicatesTypeCode <char>", "Code du type de doublon")
  .option("--duplicatesWithNoUpdate", "supprime uniquement les doublons sans changement de statut_apprenant")
  .option("--allowDiskUse", "permet d'utiliser l'espace disque pour les requetes d'aggregation mongoDb")
  .option("--dry", "ne supprime pas de donnée")
  .action(({ duplicatesTypeCode, allowDiskUse, duplicatesWithNoUpdate, dry }) => {
    runScript(async () => {
      return removeDossierApprenantsDuplicates(duplicatesTypeCode, allowDiskUse, duplicatesWithNoUpdate, dry);
    }, "duplicates-remove");
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
