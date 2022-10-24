/**
 * Mapping des Données Apprenants XLSX vers la collection DonneesApprenants
 */

const { DONNEES_APPRENANT_XLSX_FIELDS } = require("../../domain/donneesApprenants.js");
const { parseFormattedDate } = require("../../domain/date.js");

const toDonneesApprenantsFromXlsx = (donneesApprenantsXlsx) => ({
  cfd: donneesApprenantsXlsx[DONNEES_APPRENANT_XLSX_FIELDS.CFD],
  annee_scolaire: donneesApprenantsXlsx[DONNEES_APPRENANT_XLSX_FIELDS.AnneeScolaire],
  annee_formation: parseInt(donneesApprenantsXlsx[DONNEES_APPRENANT_XLSX_FIELDS.AnneeFormation]),
  nom_apprenant: donneesApprenantsXlsx[DONNEES_APPRENANT_XLSX_FIELDS.NomApprenant],
  prenom_apprenant: donneesApprenantsXlsx[DONNEES_APPRENANT_XLSX_FIELDS.PrenomApprenant],

  ...(parseFormattedDate(donneesApprenantsXlsx[DONNEES_APPRENANT_XLSX_FIELDS.DateDeNaissanceApprenant]) !== null && {
    date_de_naissance_apprenant: parseFormattedDate(
      donneesApprenantsXlsx[DONNEES_APPRENANT_XLSX_FIELDS.DateDeNaissanceApprenant]
    ),
  }),

  code_rncp: donneesApprenantsXlsx[DONNEES_APPRENANT_XLSX_FIELDS.CodeRNCP],
  telephone_apprenant: donneesApprenantsXlsx[DONNEES_APPRENANT_XLSX_FIELDS.TelephoneApprenant],
  email_apprenant: donneesApprenantsXlsx[DONNEES_APPRENANT_XLSX_FIELDS.EmailApprenant],
  ine_apprenant: donneesApprenantsXlsx[DONNEES_APPRENANT_XLSX_FIELDS.IneApprenant],
  code_commune_insee_apprenant: donneesApprenantsXlsx[DONNEES_APPRENANT_XLSX_FIELDS.CodeCommuneInseeApprenant],

  ...(parseFormattedDate(donneesApprenantsXlsx[DONNEES_APPRENANT_XLSX_FIELDS.DateInscription]) !== null && {
    date_inscription: parseFormattedDate(donneesApprenantsXlsx[DONNEES_APPRENANT_XLSX_FIELDS.DateInscription]),
  }),

  ...(parseFormattedDate(donneesApprenantsXlsx[DONNEES_APPRENANT_XLSX_FIELDS.DateFinFormation]) !== null && {
    date_fin_formation: parseFormattedDate(donneesApprenantsXlsx[DONNEES_APPRENANT_XLSX_FIELDS.DateFinFormation]),
  }),

  ...(parseFormattedDate(donneesApprenantsXlsx[DONNEES_APPRENANT_XLSX_FIELDS.DateDebutContrat]) !== null && {
    date_debut_contrat: parseFormattedDate(donneesApprenantsXlsx[DONNEES_APPRENANT_XLSX_FIELDS.DateDebutContrat]),
  }),

  ...(parseFormattedDate(donneesApprenantsXlsx[DONNEES_APPRENANT_XLSX_FIELDS.DateFinContrat]) !== null && {
    date_fin_contrat: parseFormattedDate(donneesApprenantsXlsx[DONNEES_APPRENANT_XLSX_FIELDS.DateFinContrat]),
  }),

  ...(parseFormattedDate(donneesApprenantsXlsx[DONNEES_APPRENANT_XLSX_FIELDS.DateRuptureContrat]) !== null && {
    date_rupture_contrat: parseFormattedDate(donneesApprenantsXlsx[DONNEES_APPRENANT_XLSX_FIELDS.DateRuptureContrat]),
  }),

  ...(parseFormattedDate(donneesApprenantsXlsx[DONNEES_APPRENANT_XLSX_FIELDS.DateSortieFormation]) !== null && {
    date_sortie_formation: parseFormattedDate(donneesApprenantsXlsx[DONNEES_APPRENANT_XLSX_FIELDS.DateSortieFormation]),
  }),
});

const CODES_STATUT_APPRENANT = {
  inscrit: 2,
  apprenti: 3,
  abandon: 0,
};

const toDossiersApprenantsList = (donneesApprenant) => {
  let dossiersApprenantsList = [];

  // Build common dossierApprenantFields
  const currentDossierApprenant = {};

  // Champs obligatoires
  currentDossierApprenant.nom_apprenant = donneesApprenant.nom_apprenant;
  currentDossierApprenant.prenom_apprenant = donneesApprenant.prenom_apprenant;
  currentDossierApprenant.date_de_naissance_apprenant = donneesApprenant.date_de_naissance_apprenant;
  currentDossierApprenant.uai_etablissement = donneesApprenant.user_uai;
  currentDossierApprenant.nom_etablissement = donneesApprenant.user_nom_etablissement;
  currentDossierApprenant.id_formation = donneesApprenant.cfd;
  currentDossierApprenant.annee_scolaire = donneesApprenant.annee_scolaire;

  // Champs optionnels
  currentDossierApprenant.ine_apprenant = donneesApprenant.ine_apprenant;
  currentDossierApprenant.id_erp_apprenant = donneesApprenant._id;
  currentDossierApprenant.email_contact = donneesApprenant.email_apprenant;
  currentDossierApprenant.tel_apprenant = donneesApprenant.telephone_apprenant;
  currentDossierApprenant.code_commune_insee_apprenant = donneesApprenant.code_commune_insee_apprenant;
  currentDossierApprenant.siret_etablissement = donneesApprenant.user_siret;

  // currentDossierApprenant.libelle_long_formation = donneesApprenant.xxxxxx; -- Missing
  currentDossierApprenant.formation_rncp = donneesApprenant.code_rncp;
  // currentDossierApprenant.periode_formation = donneesApprenant.xxxxx; -- Missing
  currentDossierApprenant.annee_formation = donneesApprenant.annee_formation;

  // Evènements des dates de contrat
  currentDossierApprenant.contrat_date_debut = donneesApprenant.date_debut_contrat;
  currentDossierApprenant.contrat_date_fin = donneesApprenant.date_fin_contrat;
  currentDossierApprenant.contrat_date_rupture = donneesApprenant.date_rupture_contrat;

  // S'il existe une date d'inscription , on ajoute à la liste un dossierApprenant correspondant au statut inscrit avec la date d'inscription
  if (donneesApprenant.date_inscription) {
    const dossierInscrit = {
      ...currentDossierApprenant,
      statut_apprenant: CODES_STATUT_APPRENANT.inscrit,
      date_metier_mise_a_jour_statut: donneesApprenant.date_inscription,
    };

    dossiersApprenantsList.push(dossierInscrit);
  }

  // S'il existe une date de début de contrat, on ajoute à la liste un dossierApprenant correspondant au statut apprenti avec la date de contrat
  if (donneesApprenant.date_debut_contrat) {
    const dossierApprenti = {
      ...currentDossierApprenant,
      statut_apprenant: CODES_STATUT_APPRENANT.apprenti,
      date_metier_mise_a_jour_statut: donneesApprenant.date_debut_contrat,
    };

    dossiersApprenantsList.push(dossierApprenti);
  }

  // S'il existe une date de sortie de formation, on ajoute à la liste un dossierApprenant correspondant au statut abandon avec la date de sortie de formation
  if (donneesApprenant.date_sortie_formation) {
    const dossierAbandon = {
      ...currentDossierApprenant,
      statut_apprenant: CODES_STATUT_APPRENANT.abandon,
      date_metier_mise_a_jour_statut: donneesApprenant.date_sortie_formation,
    };

    dossiersApprenantsList.push(dossierAbandon);
  }

  return dossiersApprenantsList;
};

module.exports = { toDonneesApprenantsFromXlsx, CODES_STATUT_APPRENANT, toDossiersApprenantsList };
