const { object, string, objectId, date, integer, arrayOf } = require("./json-schema/jsonSchemaTypes");

const collectionName = "dossiersApprenants";

const indexes = () => {
  return [
    [{ uai_etablissement: 1 }, { name: "uai_etablissement" }],
    [{ siret_etablissement: 1 }, { name: "siret_etablissement" }],
    [{ formation_cfd: 1 }, { name: "formation_cfd" }],
    [{ etablissement_num_region: 1 }, { name: "etablissement_num_region" }],
    [{ etablissement_num_departement: 1 }, { name: "etablissement_num_departement" }],
    [{ annee_scolaire: 1 }, { name: "annee_scolaire" }],
    [{ etablissement_reseaux: 1 }, { name: "etablissement_reseaux" }],
  ];
};

const schema = object({
  _id: objectId(),
  ine_apprenant: string({ description: "N° INE de l'apprenant" }),
  nom_apprenant: string({ description: "Nom de l'apprenant" }),
  prenom_apprenant: string({ description: "Prénom de l'apprenant" }),
  email_contact: string({ description: "Adresse mail de contact de l'apprenant" }),
  formation_cfd: string({ description: "CFD de la formation à laquelle l'apprenant est inscrit" }),
  libelle_long_formation: string({ description: "Libellé court de la formation visée" }),
  niveau_formation: string({ description: "Le niveau de la formation (ex: 3)" }),
  niveau_formation_libelle: string({ description: "Libellé du niveau de la formation (ex: '3 (BTS, DUT...)')" }),
  uai_etablissement: string({ description: "Code uai de l'établissement formateur" }),
  siret_etablissement: string({ description: "Siret de l'établissement d'origine" }),
  siret_catalogue: string({ description: "Siret de l'établissement retrouvé depuis le catalogue" }),
  nom_etablissement: string({ description: "Nom de l'établissement d'origine" }),
  etablissement_reseaux: arrayOf(string(), {
    description: "Réseaux auxquels appartient l'organisme de formation de l'apprenant",
  }),
  etablissement_adresse: string({ description: "Adresse complète du CFA" }),
  etablissement_localite: string({ description: "Localité du CFA" }),
  etablissement_nom_region: string({ description: "Région du CFA" }),
  etablissement_num_region: string({ description: "Numéro de la région du CFA" }),
  etablissement_num_departement: string({ description: "Numéro de departement du CFA" }),
  etablissement_nom_departement: string({ description: "Nom du departement du CFA" }),
  etablissement_nom_academie: string({ description: "Nom de l'académie du CFA" }),
  etablissement_num_academie: string({ description: "Numéro de l'académie du CFA" }),
  etablissement_gestionnaire_uai: string({ description: "UAI du CFA gestionnaire - depuis le catalogue" }),
  etablissement_formateur_uai: string({ description: "UAI du CFA formateur - depuis le catalogue" }),
  historique_statut_apprenant: arrayOf(object(), { description: "Historique du statut de l'apprenant" }),
  periode_formation: arrayOf(integer(), { description: "Date debut & date de fin de la formation" }),
  annee_formation: integer({ description: "Numéro de l'année dans la formation (promo)" }),
  annee_scolaire: string({ description: `Année scolaire sur laquelle l'apprenant est enregistré (ex: "2020-2021")` }),
  updated_at: date({ description: "Date de mise à jour en base de données" }),
  created_at: date({ description: "Date d'ajout en base de données" }),
  source: string({ description: "Source du dossier apprenant (Ymag, Gesti...)" }),
  id_erp_apprenant: string({ description: "Identifiant de l'apprenant dans l'erp" }),
  tel_apprenant: string({ description: "Numéro de téléphone de l'apprenant" }),
  code_commune_insee_apprenant: string({ description: "Code commune insee de l'apprenant" }),
  date_de_naissance_apprenant: date({ description: "Date de naissance de l'apprenant" }),
  etablissement_formateur_ville: string({ description: "Ville de l'établissement formateur" }),
  contrat_date_debut: date({ description: "Date de début du contrat" }),
  contrat_date_fin: date({ description: "Date de fin du contrat" }),
  contrat_date_rupture: date({ description: "Date de rupture du contrat" }),
  formation_rncp: string({ description: "Code RNCP de la formation à laquelle l'apprenant est inscrit" }),
});

module.exports = {
  schema,
  collectionName,
  indexes,
};
