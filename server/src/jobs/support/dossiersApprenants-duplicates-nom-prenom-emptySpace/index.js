const cliProgress = require("cli-progress");

const { runScript } = require("../../scriptWrapper");
const logger = require("../../../common/logger");
const { asyncForEach } = require("../../../common/utils/asyncUtils");
const { JOB_NAMES } = require("../../../common/constants/jobsConstants");
const { DossierApprenantModel } = require("../../../common/model");

const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

/**
 * Job de suppression des doublons de dossiersApprenants avec un leading ou ending space dans le nom ou prénom apprenant
 * Pour chaque dossier ayant un espace au début / fin du nom ou prénom on cherche s'il existe un dossier "corrigé" plus récent.
 * c'est à dire un dossier ayant la même clé d'unicité mais sans l'espace.
 * Si on trouve un dossier "corrigé" et plus récent on supprime le mauvais dossier (avec les espaces)
 * Si on ne trouve pas de dossier, on supprime les espaces sur le nom_apprenant et le prenom_apprenant
 */
runScript(async ({ dossiersApprenants }) => {
  logger.info("Run clean dossiersApprenants with empty space in nom/prenom ...");
  await cleanDossiersApprenantsNomPrenomSpaces(dossiersApprenants);
  logger.info("End cleaning DossierApprenant with empty spaces in nom/prenom !");
}, JOB_NAMES.dossiersApprenantsCleanDuplicatesNomPrenomSpaces);

/**
 * Méthode principale de clean des doublons de dossiersApprenants avec un leading ou ending space dans le nom ou prénom apprenant
 */
const cleanDossiersApprenantsNomPrenomSpaces = async (dossiersApprenants) => {
  // Gets dossiers apprenants with nom_apprenant or prenom_apprenant with leading or ending empty space
  const dossiersApprenantsWithEmptySpacesInNomPrenom = await DossierApprenantModel.find({
    $or: [
      { nom_apprenant: /^ .*/i }, // nom_apprenant with leading empty space
      { nom_apprenant: /.* $/i }, // nom_apprenant with ending empty space
      { prenom_apprenant: /^ .*/i }, // prenom_apprenant with leading empty space
      { prenom_apprenant: /.* $/i }, // prenom_apprenant with ending empty space
    ],
  }).lean();

  logger.info(
    `${dossiersApprenantsWithEmptySpacesInNomPrenom.length} dossiers apprenants found with leading / ending space in nom_apprenant or prenom_apprenant`
  );

  loadingBar.start(dossiersApprenantsWithEmptySpacesInNomPrenom.length, 0);
  let nbDossiersWithUnicityKeyCleanToRemove = 0;
  let nbDossiersWithoutUnicityKeyCleanToUpdate = 0;

  // Find most ancients entry for each duplicate
  await asyncForEach(dossiersApprenantsWithEmptySpacesInNomPrenom, async (currentDossierWithEmptySpaceInNomPrenom) => {
    loadingBar.increment();

    // Check if any more recent dossier with unicity key containing clean nom/prenom is present
    const shouldRemoveDossier = await findRecentDossierWithUnicityKeyWithCleanNomPrenom(
      dossiersApprenants,
      currentDossierWithEmptySpaceInNomPrenom
    );

    if (shouldRemoveDossier) {
      // Delete dossier, a recent one with nom_apprenant / prenom_apprenant fixed already exists
      await DossierApprenantModel.deleteOne({ _id: currentDossierWithEmptySpaceInNomPrenom._id });
      nbDossiersWithUnicityKeyCleanToRemove++;
    } else {
      // Update dossier with nom_apprenant and prenom_apprenant trimmed
      await DossierApprenantModel.findByIdAndUpdate(currentDossierWithEmptySpaceInNomPrenom._id, {
        nom_apprenant: currentDossierWithEmptySpaceInNomPrenom.nom_apprenant.trim(),
        prenom_apprenant: currentDossierWithEmptySpaceInNomPrenom.prenom_apprenant.trim(),
      });
      nbDossiersWithoutUnicityKeyCleanToUpdate++;
    }
  });

  loadingBar.stop();

  logger.info(
    `${dossiersApprenantsWithEmptySpacesInNomPrenom.length} dossiers apprenants found with leading / ending space in nom_apprenant or prenom_apprenant`
  );
  logger.info(
    `${nbDossiersWithUnicityKeyCleanToRemove} dossiers with recent unicity key using clean nom/prenom found were removed !`
  );
  logger.info(
    `${nbDossiersWithoutUnicityKeyCleanToUpdate} dossiers without recent unicity key using clean nom/prenom found were update with trimmed nom_apprenant or prenom_apprenant.`
  );
};

/**
 * Fonction de récupération d'un dossier plus récent que celui passé en paramètre et dont la clé
 * d'unicité ne contient pas d'espace au début / fin pour le nom et / ou prénom apprenant
 */
const findRecentDossierWithUnicityKeyWithCleanNomPrenom = async (
  dossiersApprenants,
  {
    nom_apprenant,
    prenom_apprenant,
    date_de_naissance_apprenant,
    formation_cfd,
    uai_etablissement,
    annee_scolaire,
    created_at,
  }
) => {
  const foundItem = await dossiersApprenants.getDossierApprenant({
    nom_apprenant: nom_apprenant.trim(), // Search for nom_apprenant without leading / ending spaces
    prenom_apprenant: prenom_apprenant.trim(), // Search for prenom_apprenant without leading / ending spaces
    date_de_naissance_apprenant,
    formation_cfd,
    uai_etablissement,
    annee_scolaire,
  });

  return foundItem ? foundItem.created_at.getTime() > created_at : false;
};
