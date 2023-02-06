import {
  object,
  string,
  objectId,
  date,
  integer,
  arrayOf,
  stringOrNull,
  dateOrNull,
  arrayOfOrNull,
  integerOrNull,
} from "./json-schema/jsonSchemaTypes.js";

export const collectionName = "dossiersApprenants";

export const indexes = () => {
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

const schema = object(
  {
    _id: objectId(),
    ine_apprenant: stringOrNull({ description: "N° INE de l'apprenant" }),
    nom_apprenant: string({ description: "Nom de l'apprenant" }),
    prenom_apprenant: string({ description: "Prénom de l'apprenant" }),
    email_contact: stringOrNull({ description: "Adresse mail de contact de l'apprenant" }),
    formation_cfd: string({ description: "CFD de la formation à laquelle l'apprenant est inscrit" }),
    libelle_long_formation: stringOrNull({ description: "Libellé court de la formation visée" }),
    niveau_formation: stringOrNull({ description: "Le niveau de la formation (ex: 3)" }),
    niveau_formation_libelle: stringOrNull({
      description: "Libellé du niveau de la formation (ex: '3 (BTS, DUT...)')",
    }),
    uai_etablissement: string({ description: "Code UAI de l'établissement formateur" }),
    siret_etablissement: stringOrNull({ description: "Siret de l'établissement d'origine" }),
    nom_etablissement: string({ description: "Nom de l'établissement d'origine" }),
    etablissement_reseaux: arrayOfOrNull(string(), {
      description: "Réseaux auxquels appartient l'organisme de formation de l'apprenant",
    }),
    etablissement_adresse: stringOrNull({ description: "Adresse complète du CFA" }),
    etablissement_nom_region: stringOrNull({ description: "Région du CFA" }),
    etablissement_num_region: stringOrNull({ description: "Numéro de la région du CFA" }),
    etablissement_num_departement: stringOrNull({ description: "Numéro de departement du CFA" }),
    etablissement_nom_departement: stringOrNull({ description: "Nom du departement du CFA" }),
    historique_statut_apprenant: arrayOf(
      object({}, { additionalProperties: true, description: "Historique du statut de l'apprenant" })
    ),
    periode_formation: arrayOfOrNull(integer(), { description: "Date debut & date de fin de la formation" }),
    annee_formation: integerOrNull({ description: "Numéro de l'année dans la formation (promo)" }),
    annee_scolaire: string({
      description: `Année scolaire sur laquelle l'apprenant est enregistré (ex: "2020-2021")`,
    }),
    updated_at: dateOrNull({ description: "Date de mise à jour en base de données" }),
    created_at: date({ description: "Date d'ajout en base de données" }),
    source: string({ description: "Source du dossier apprenant (Ymag, Gesti...)" }),
    id_erp_apprenant: stringOrNull({ description: "Identifiant de l'apprenant dans l'erp" }),
    tel_apprenant: stringOrNull({ description: "Numéro de téléphone de l'apprenant" }),
    code_commune_insee_apprenant: stringOrNull({ description: "Code commune insee de l'apprenant" }),
    date_de_naissance_apprenant: dateOrNull({ description: "Date de naissance de l'apprenant" }),
    contrat_date_debut: dateOrNull({ description: "Date de début du contrat" }),
    contrat_date_fin: dateOrNull({ description: "Date de fin du contrat" }),
    contrat_date_rupture: dateOrNull({ description: "Date de rupture du contrat" }),
    formation_rncp: stringOrNull({ description: "Code RNCP de la formation à laquelle l'apprenant est inscrit" }),
  },
  {
    required: ["nom_apprenant", "prenom_apprenant", "uai_etablissement", "formation_cfd", "annee_scolaire"],
  }
);

export default { schema, indexes, collectionName };
