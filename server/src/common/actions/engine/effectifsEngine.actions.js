import { findDossierApprenantByQuery } from "../dossiersApprenants.actions.js";
import { findOrganismeByUai } from "../organismes.actions.js";

/**
 * Fonction core moteur des effectifs
 * A partir d'une liste de dossiersApprenant en input va effectuer tous les contrôles nécessaires pour chaque dossier
 * 1 - Contrôle & fiabilisation en entrée de l'organisme
 * 1 a - Construction de la liste des organismes non valides
 * 1 b - Construction de la liste des organismes à créer si nécessaire
 * 2 a - Construction de la liste des dossiersApprenants à créer
 * 2 b - Construction de la liste des dossiersApprenants à mettre à jour
 * 3 a - Construction de la liste des effectifs à créer
 * 3 a - Construction de la liste des effectifs à mettre à jour
 * 3 a - Construction de la liste des effectifs non valides
 * @param {*} dossiersApprenants
 * @returns
 */
export const hydrateEngine = async (dossiersApprenants) => {
  let dossiersApprenantsToCreate = [];
  let dossiersApprenantsToUpdate = [];
  let organismesToCreate = [];
  let organismesNotValid = [];
  let effectifsToCreate = [];
  let effectifsNotValid = [];

  // TODO WIP logic
  // Traitement des dossiersApprenants
  for (const currentDossierApprenant of dossiersApprenants) {
    // Recherche du dossier via sa clé d'unicité
    const foundDossierApprenantWithUnicityFields = await findDossierApprenantByQuery(
      {
        id_erp_apprenant: currentDossierApprenant.id_erp_apprenant,
        uai_etablissement: currentDossierApprenant.uai_etablissement,
        annee_scolaire: currentDossierApprenant.annee_scolaire,
      },
      { _id: 1 }
    );

    // Création d'un nouveau dossierApprenant
    if (!foundDossierApprenantWithUnicityFields) {
      // Vérification de l'organisme
      const organismeForDossierApprenant = await findOrganismeByUai(currentDossierApprenant.uai_etablissement);
      if (!organismeForDossierApprenant) {
        // TODO sortir ce traitement dans une fonction
        // TODO Call controle / fiabilisation méthode si organisme valid => on l'ajout à organismesToCreate
        // TODO si nonValid => on l'ajout à organismesNotValid
        // TODO si déja existant : RAS
        // organismesToCreate.push({
        //   uai: currentDossierApprenant.uai_etablissement,
        //   siret: currentDossierApprenant.siret_etablissement,
        //   nom: currentDossierApprenant.nom_etablissement,
        // });
        //organismesNotValid.push({
        //   uai: currentDossierApprenant.uai_etablissement,
        //   siret: currentDossierApprenant.siret_etablissement,
        //   nom: currentDossierApprenant.nom_etablissement,
        // });

        // Si organisme à créer alors dossierApprenant a créer aussi
        // Sinon uniquement organisme en erreur
        dossiersApprenantsToCreate.push(currentDossierApprenant);

        // Vérification de l'effectif construit
        // TODO Call createEffectifFromDossierApprenant si effectif valid => on l'ajout à effectifsToCreate
        // TODO sinon => on l'ajout à effectifsNotValid
      }
      // MAJ d'un dossierApprenant existant
    } else {
      // TODO Vérification de l'organisme & construction

      dossiersApprenantsToUpdate.push(currentDossierApprenant);
    }
  }

  return {
    organismes: {
      toCreate: [],
      notValid: [],
    },
    dossiersApprenantsMigration: {
      toCreate: [],
      toUpdate: [],
    },
    effectifs: {
      toCreate: [],
      toUpdate: [],
      notValid: [],
    },
  };
};

/**
 * Fonction de run du moteur de construction des dossiersApprenant / effectifs / organismes
 * Va hydrate l'engine et pour chaque collection créer / mettre à jour les données liées
 * @param {*} dossiersApprenants
 */
export const runEngine = async (dossiersApprenants) => {
  const { organismes, dossiersApprenantsMigration, effectifs } = hydrateEngine(dossiersApprenants);

  // TODO CRUD each collection
  // organismes toCreate call createOrganisme
  // organismes notValid to log ??

  // DossiersApprenant toCreate call createDossierApprenant
  // DossiersApprenant toUpdate call updateDossierApprenant

  // Effectifs toCreate call createEffectifFromDossierApprenant
  // Effectifs toUpdate call updateEffectif
  // Effectifs notValid to log ??

  // TODO Call Api Entreprise for organisme
};
