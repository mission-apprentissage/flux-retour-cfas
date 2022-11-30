import Joi from "joi";
import { CODES_STATUT_APPRENANT } from "../../../../constants/dossierApprenantConstants.js";
import { schemaValidation } from "../../../../utils/schemaUtils.js";
import { siretSchema } from "../../../../utils/validationUtils.js";
import { adresseSchema } from "../../../json-schema/adresseSchema.js";
import { object, string, date, integer, boolean, arrayOf } from "../../../json-schema/jsonSchemaTypes.js";

export const apprenantSchema = object(
  {
    ine: string({ description: "N° INE de l'apprenant" }),
    nom: string({ description: "Nom de l'apprenant" }),
    prenom: string({ description: "Prénom de l'apprenant" }),
    sexe: string({
      description: `**Sexe de l'apprenant**\r\n  M : Homme\r\n  F : Femme`,
      enum: ["M", "F"],
    }),
    date_de_naissance: date({ description: "Date de naissance de l'apprenant" }),
    code_postal_de_naissance: string({
      description: "Le code postal doit contenir 5 caractères",
      example: "75000",
      pattern: "^[0-9]{5}$",
      maxLength: 5,
      minLength: 5,
    }),
    nationalite: integer({
      description: `Apprenant étranger, non citoyen européen`,
      enum: [1, 2, 3],
    }),
    regime_scolaire: integer({
      // TODO
      description: `**Régime scolaire** :\r\n  1 : MSA\r\n  2 : URSSAF`,
      enum: [0, 1, 2],
    }),
    handicap: boolean({
      description: "Apprenant en situation d'handicape (RQTH)",
    }),
    inscription_sportif_haut_niveau: boolean({
      description:
        "Apprenant inscrit sur la liste des sportifs, entraîneurs, arbitres et juges sportifs de haut niveau",
    }),
    courriel: string({ description: "Adresse mail de contact de l'apprenant" }),
    telephone: string({
      description: `Dans le cas d'un numéro français, il n'est pas 
      nécessaire de saisir le "0" car l'indicateur pays est 
      pré-renseigné.
      Il doit contenir 9 chiffres après l'indicatif.`,
      example: "+33908070605",
      pattern: "^([+])?(\\d{7,12})$",
      maxLength: 13,
      minLength: 8,
    }),
    adresse: {
      ...adresseSchema,
      properties: {
        ...adresseSchema.properties,
        numero: {
          ...adresseSchema.properties.numero,
        },
        voie: {
          ...adresseSchema.properties.voie,
        },
        complement: {
          ...adresseSchema.properties.complement,
        },
        code_postal: {
          ...adresseSchema.properties.code_postal,
        },
        code_insee: {
          ...adresseSchema.properties.code_insee,
          description: "Code commune insee de l'apprenant",
        },
        commune: {
          ...adresseSchema.properties.commune,
        },
      },
    },
    historique_statut: arrayOf(
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
        }
      ),
      {
        description: "Historique du statut de l'apprenant",
      }
    ),
    situation_avant_contrat: integer({
      enum: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], // TODO
      description: `**Situation de l'apprenant avant le contrat`,
    }),
    derniere_situation: integer({
      enum: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], // TODO
      description: `**Situation de l'apprenant n-1`,
    }),
    dernier_diplome: integer({
      enum: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], // TODO
      description: `**Dernier diplome obtenu`,
    }),
    mineur: boolean({
      description: "l'apprenant(e) sera-t-il(elle) mineur(e) ? (calc)",
    }),
    mineur_emancipe: boolean({
      description: `Un mineur émancipé peut accomplir seul les actes nécessitant la majorité légale. Plus d'informations à propos de l'émancipation sur [le site du Service public.](https://www.service-public.fr/particuliers/vosdroits/F1194) `,
    }),
    representant_legal: object({
      nom: string({ description: "Nom du representant légal" }),
      prenom: string({ description: "Prénom du representant légal" }),
      meme_adresse: boolean({
        description: "l'apprenti(e) vit à la même adresse que son representant légal",
      }),
      adresse: {
        ...adresseSchema,
      },
      courriel: string({ description: "Adresse mail de contact du representant légal" }),
      telephone: string({
        description: `Dans le cas d'un numéro français, il n'est pas 
      nécessaire de saisir le "0" car l'indicateur pays est 
      pré-renseigné.
      Il doit contenir 9 chiffres après l'indicatif.`,
        example: "+33908070605",
        pattern: "^([+])?(\\d{7,12})$",
        maxLength: 13,
        minLength: 8,
      }),
    }),
    contrats: arrayOf(
      object(
        {
          siret: string({
            description: "N° SIRET de l'employeur",
            pattern: "^[0-9]{14}$",
            maxLength: 14,
            minLength: 14,
          }),
          naf: string({
            maxLength: 6,
            description:
              "Le Code NAF est composé de 4 chiffres et 1 lettre. Il est délivré par l'INSEE.[Informations sur le Code NAF.](https://www.economie.gouv.fr/entreprises/activite-entreprise-code-ape-code-naf)",
            example: "1031Z",
            pattern: "^([0-9]){2}\\.?([0-9]){0,2}([a-zA-Z]){0,1}$",
          }),
          nombre_de_salaries: integer({
            description:
              "L'effectif salarié rempli automatiquement correspond à l'estimation de la base Entreprises de l'INSEE. <br/>L'effectif renseigné est celui de l’entreprise dans sa globalité (et non seulement l’effectif de l’établissement d’exécution du contrat).",
            example: 123,
          }),
          adresse: {
            ...adresseSchema,
          },
          date_debut: date({ description: "Date de début du contrat" }),
          date_fin: date({ description: "Date de fin du contrat" }),
          date_rupture: date({ description: "Date de rupture du contrat" }),
        },
        {
          required: ["date_debut", "date_fin", "date_rupture"],
          additionalProperties: true,
        }
      ),
      {
        description: "Historique des contrats de l'apprenant",
      }
    ),
  },
  {
    required: ["nom", "prenom", "historique_statut"],
    additionalProperties: true,
  }
);

// Default value
export function defaultValuesApprenant() {
  return {
    historique_statut: [],
    contrats: [],
  };
}

// Extra validation
export function validateApprenant({ contrats, ...props }) {
  return {
    ...schemaValidation(props, apprenantSchema, [
      {
        name: "courriel",
        base: Joi.string().email(),
      },
    ]),
    contrats: contrats.map((contrat) => {
      return schemaValidation({ contrat }, apprenantSchema, [
        {
          name: "siret",
          base: siretSchema(),
        },
      ]);
    }),
  };
}
