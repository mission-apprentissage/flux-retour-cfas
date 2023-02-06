import Joi from "joi";
import { object, string, objectId, date, integer, arrayOf, boolean } from "./json-schema/jsonSchemaTypes.js";
import { schemaValidation } from "../utils/schemaUtils.js";
import { siretSchema, uaiSchema } from "../utils/validationUtils.js";
import { CODES_STATUT_APPRENANT } from "../constants/dossierApprenantConstants.js";
import { REGIONS } from "../constants/territoiresConstants.js";

export const collectionName = "dossiersApprenantsMigration";

export const indexes = () => {
  return [
    [
      { id_erp_apprenant: 1, uai_etablissement: 1, annee_scolaire: 1 },
      { name: "uai_id_erp_annee_scolaire", unique: true },
    ],
    [{ organisme_id: 1 }, { name: "organisme_id" }],
    [{ siret_etablissement: 1 }, { name: "siret_etablissement" }],

    [{ formation_cfd: 1 }, { name: "formation_cfd" }],
    [{ etablissement_num_region: 1 }, { name: "etablissement_num_region" }],
    [{ etablissement_num_departement: 1 }, { name: "etablissement_num_departement" }],
    [{ annee_scolaire: 1 }, { name: "annee_scolaire" }],
    [{ etablissement_reseaux: 1 }, { name: "etablissement_reseaux" }],
  ];
};

export const schema = object(
  {
    _id: objectId(),
    organisme_id: objectId({
      description: "Organisme id",
    }),
    id_erp_apprenant: string({ description: "Identifiant de l'apprenant dans l'erp" }),
    source: string({ description: "Source du dossier apprenant (Ymag, Gesti, MANUEL...)" }), // TODO ENUM of this ? maybe not
    annee_scolaire: string({
      description: `Année scolaire sur laquelle l'apprenant est enregistré (ex: "2020-2021")`,
      pattern: "^\\d{4}-\\d{4}$",
    }),

    // Etablissement
    uai_etablissement: string({ description: "Code UAI de l'établissement formateur" }),
    siret_etablissement: string({ description: "Siret de l'établissement d'origine" }),
    etablissement_reseaux: arrayOf(string(), {
      description: "Réseaux auxquels appartient l'organisme de formation de l'apprenant",
    }), // TODO [tech] MUST BE REMOVE after migration => Useless
    nom_etablissement: string({ description: "Nom de l'établissement d'origine" }),
    etablissement_adresse: string({ description: "Adresse complète du CFA" }),
    etablissement_nom_region: string({ description: "Région du CFA" }),
    etablissement_num_region: string({
      description: "Numéro de la région du CFA",
      enum: REGIONS.map(({ code }) => code),
    }),
    etablissement_num_departement: string({ description: "Numéro de departement du CFA" }),
    etablissement_nom_departement: string({ description: "Nom du departement du CFA" }),

    // Apprenant
    ine_apprenant: string({ description: "N° INE de l'apprenant" }),
    nom_apprenant: string({ description: "Nom de l'apprenant" }),
    prenom_apprenant: string({ description: "Prénom de l'apprenant" }),
    email_contact: string({ description: "Adresse mail de contact de l'apprenant" }),
    date_de_naissance_apprenant: date({ description: "Date de naissance de l'apprenant" }),
    telephone_apprenant: string({
      description: `Dans le cas d'un numéro français, il n'est pas 
        nécessaire de saisir le "0" car l'indicateur pays est 
        pré-renseigné.
        Il doit contenir 9 chiffres après l'indicatif.`,
      example: "+33908070605",
      pattern: "^([+])?(\\d{7,12})$",
      maxLength: 13,
      minLength: 8,
    }),
    code_commune_insee_apprenant: string({
      description: "Code commune insee de l'apprenant",
      pattern: "^[0-9]{1}[0-9A-Z]{1}[0-9]{3}$",
      maxLength: 5,
      minLength: 5,
    }),
    historique_statut_apprenant: arrayOf(
      object(
        {
          valeur_statut: integer({
            enum: Object.values(CODES_STATUT_APPRENANT),
          }),
          date_statut: date(),
          date_reception: date(),
        },
        {
          required: ["valeur_statut", "date_statut", "date_reception"],
          additionalProperties: true,
          description: "Historique du statut de l'apprenant",
        }
      )
    ),

    // contrat
    employeur_siret: string({
      description: "N° SIRET de l'employeur",
      pattern: "^[0-9]{14}$",
      maxLength: 14,
      minLength: 14,
    }),
    contrat_date_debut: date({ description: "Date de début du contrat" }),
    contrat_date_fin: date({ description: "Date de fin du contrat" }),
    contrat_date_rupture: date({ description: "Date de rupture du contrat" }),

    formation_cfd: string({
      description: "CFD de la formation à laquelle l'apprenant est inscrit",
      pattern: "^[0-9A-Z]{8}[A-Z]?$",
      maxLength: 8,
    }),
    formation_rncp: string({
      description: "Code RNCP de la formation à laquelle l'apprenant est inscrit",
      pattern: "^(RNCP)?[0-9]{2,5}$",
      maxLength: 9,
    }),
    libelle_long_formation: string({ description: "Libellé court de la formation visée" }),
    niveau_formation: string({ description: "Le niveau de la formation (ex: 3)" }),
    niveau_formation_libelle: string({
      description: "Libellé du niveau de la formation (ex: '3 (BTS, DUT...)')",
    }),
    periode_formation: arrayOf(integer(), { description: "Date debut & date de fin de la formation" }),
    annee_formation: integer({ description: "Numéro de l'année dans la formation (promo)" }),

    // Technique
    updated_at: date({ description: "Date de mise à jour en base de données" }),
    created_at: date({ description: "Date d'ajout en base de données" }),
    archive: boolean({ description: "Dossier apprenant est archivé (retnetion maximum 5 ans)" }),
  },
  {
    required: [
      "id_erp_apprenant",
      "uai_etablissement",
      "siret_etablissement",
      "organisme_id",
      "source",

      "nom_apprenant",
      "prenom_apprenant",
      "formation_cfd",
      "annee_scolaire",

      "historique_statut_apprenant",
    ],
    additionalProperties: true,
  }
);

// Default value
export function defaultValuesDossiersApprenantsMigration() {
  return {
    etablissement_reseaux: [],
    historique_statut_apprenant: [],
    periode_formation: [],
    updated_at: new Date(),
    created_at: new Date(),
  };
}

// Extra validation
export function validateDossiersApprenantsMigration(props) {
  return schemaValidation({
    entity: props,
    schema,
    extensions: [
      {
        name: "uai_etablissement",
        base: uaiSchema(),
      },
      {
        name: "siret_etablissement",
        base: siretSchema(),
      },
      {
        name: "employeur_siret",
        base: siretSchema(),
      },
      {
        name: "email_contact",
        base: Joi.string().email(),
      },
    ],
  });
}

export default { schema, indexes, collectionName };
