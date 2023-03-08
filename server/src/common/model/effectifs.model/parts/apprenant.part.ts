import Joi from "joi";
import { flattenDeep } from "lodash-es";

import { CODES_STATUT_APPRENANT } from "../../../constants/dossierApprenantConstants.js";
import { schemaValidation } from "../../../utils/schemaUtils.js";
import { siretSchema } from "../../../utils/validationUtils.js";
import { adresseSchema } from "../../json-schema/adresseSchema.js";
import { object, string, date, integer, boolean, arrayOf } from "../../json-schema/jsonSchemaTypes.js";

export const apprenantSchema = object(
  {
    ine: string({
      description: "N° INE de l'apprenant",
      example: "0494004062M",
      pattern: "^([0-9]{9}[a-zA-Z]{2}|[0-9]{10}[a-zA-Z]{1})$",
    }),
    nom: string({ description: "Nom de l'apprenant", pattern: "^.+$" }),
    prenom: string({ description: "Prénom de l'apprenant", pattern: "^.+$" }),
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
      description: "Apprenant étranger, non citoyen européen",
      enum: [1, 2, 3],
    }),
    regime_scolaire: string({
      description:
        "**Régime scolaire** :\r\n  I : Interne\r\n  D : Demi-pensionnaire\r\n E : Externe\r\n IE : Interne externé",
      enum: ["I", "D", "E", "IE"],
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
        repetition_voie: {
          ...adresseSchema.properties.repetition_voie,
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
        complete: {
          ...adresseSchema.properties.complete,
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
          required: ["valeur_statut", "date_statut"],
          additionalProperties: true,
        }
      ),
      {
        description: "Historique du statut de l'apprenant",
      }
    ),
    situation_avant_contrat: integer({
      enum: [11, 12, 21, 31, 41, 51, 52, 53, 54, 90, 99],
      description: `**Situation de l'apprenant avant le contrat`,
    }),
    derniere_situation: integer({
      enum: [
        1003, 1005, 1009, 1013, 1015, 1017, 1018, 1019, 1021, 1023, 2001, 2003, 2005, 2007, 3001, 3101, 3003, 3103,
        3009, 3109, 3011, 3111, 3031, 3131, 3032, 3132, 3033, 3133, 3117, 3119, 3021, 3121, 3023, 3123, 4001, 4101,
        4003, 4103, 4005, 4105, 4007, 4107, 4009, 4011, 4111, 4013, 4113, 4015, 4115, 4017, 4117, 4019, 4119, 4021,
        4121, 5901, 5903, 5905, 5907, 5909, 9900, 9999,
      ],
      description: `**Situation de l'apprenant n-1`,
    }),
    dernier_organisme_uai: string({
      description:
        "Numéro UAI de l’établissement fréquenté l’année dernière (N-1), si déjà en apprentissage, mettre l’UAI du site de formation ou departement",
      pattern: "^([0-9][0-9]|2[AB]|9[012345]|97[1234678]|98[46789]|[0-9]{7}[a-zA-Z])$",
    }),
    organisme_gestionnaire: integer({
      enum: [11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 23, 24, 25],
      description: "**Organisme gestionnaire de l’établissement",
    }),

    dernier_diplome: integer({
      enum: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 99],
      description: "**Dernier diplome obtenu",
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
      pcs: integer({
        enum: [
          10, 21, 22, 23, 31, 33, 34, 37, 38, 42, 43, 44, 45, 46, 47, 48, 52, 53, 54, 55, 56, 61, 66, 69, 71, 72, 73,
          76, 81, 82, 99,
        ],
        description: "**Nomenclatures des professions et catégories socioprofessionnelles",
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
          denomination: string({
            description: "La dénomination sociale doit être celle de l'établissement dans lequel le contrat s'exécute.",
          }),
          type_employeur: integer({
            enum: [11, 12, 13, 14, 15, 16, 21, 22, 23, 24, 25, 26, 27, 28, 29],
            description: "Le type d'employeur doit être en adéquation avec son statut juridique.",
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
          required: ["date_debut", "date_fin"], // TODO siret // Removed required date_rupture car on contrat peut ne pas avoir de rupture
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
export function validateApprenant({ contrats, ...props }, getErrors = false) {
  const contratsValidation = contrats.map((contrat, i) => {
    return schemaValidation({
      entity: contrat,
      schema: apprenantSchema.properties.contrats.items,
      extensions: [
        {
          name: "siret",
          base: siretSchema(),
        },
        {
          name: "date_debut",
          base: Joi.date().iso(),
        },
        {
          name: "date_fin",
          base: Joi.date().iso(),
        },
        {
          name: "date_rupture",
          base: Joi.date().iso(),
        },
      ],
      getErrors,
      prefix: `apprenant.contrats[${i}].`,
    });
  });
  let representantLegalValidation = null;
  if (props.representant_legal) {
    representantLegalValidation = schemaValidation({
      entity: props.representant_legal,
      schema: apprenantSchema.properties.representant_legal,
      extensions: [
        {
          name: "courriel",
          base: Joi.string().email(),
        },
      ],
      getErrors,
      prefix: "apprenant.representant_legal.",
    });
  }
  const entityValidation = schemaValidation({
    entity: props,
    schema: apprenantSchema,
    extensions: [
      {
        name: "courriel",
        base: Joi.string().email(),
      },
      {
        name: "date_de_naissance",
        base: Joi.date().iso(),
      },
    ],
    getErrors,
    prefix: "apprenant.",
  });

  if (getErrors) {
    let errors = [...entityValidation, ...(representantLegalValidation ?? []), ...flattenDeep(contratsValidation)];
    return errors;
  }

  return {
    ...entityValidation,
    ...(representantLegalValidation ? { representant_legal: representantLegalValidation } : {}),
    contrats: contratsValidation,
  };
}
