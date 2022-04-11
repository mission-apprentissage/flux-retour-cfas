/**
 * Fonction qui renvoi la liste des champs de la clé d'unicité depuis une liste de dossiersApprenants
 * @param {*} dossiersApprenants
 * @returns
 */
const getUnicityFieldsFromDossiersApprenantsList = (dossiersApprenants) =>
  dossiersApprenants.map((item) => ({
    nom_apprenant: item.nom_apprenant,
    prenom_apprenant: item.prenom_apprenant,
    date_de_naissance_apprenant: item.date_de_naissance_apprenant,
    formation_cfd: item.formation_cfd,
    uai_etablissement: item.uai_etablissement,
    annee_scolaire: item.annee_scolaire,
  }));

/**
 * Fonction qui renvoi la liste des champs de la clé d'unicité depuis un objet dossierApprenant
 * @param {*} param0
 * @returns
 */
const getUnicityFieldsFromDossierApprenant = ({
  nom_apprenant,
  prenom_apprenant,
  date_de_naissance_apprenant,
  formation_cfd,
  uai_etablissement,
  annee_scolaire,
}) => ({
  nom_apprenant,
  prenom_apprenant,
  date_de_naissance_apprenant,
  formation_cfd,
  uai_etablissement,
  annee_scolaire,
});

module.exports = {
  getUnicityFieldsFromDossiersApprenantsList,
  getUnicityFieldsFromDossierApprenant,
};
