import Joi from "joi";
import { CODES_STATUT_APPRENANT } from "../../../../constants/dossierApprenantConstants.js";
import { schemaValidation } from "../../../../utils/schemaUtils.js";
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
    nationalite: integer({
      description: `Apprenant étranger, non citoyen européen`,
      enum: [1, 2, 3],
    }),
    // departementNaissance
    // communeNaissance
    handicap: boolean({
      description: "Apprenant en situation d'handicape (RQTH)",
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
    contrats: arrayOf(
      object(
        {
          siret: string({
            description: "N° SIRET de l'employeur",
            pattern: "^[0-9]{14}$",
            maxLength: 14,
            minLength: 14,
          }),
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
export function validateApprenant(props) {
  // props.contrats.map((contrat) => siret(contrat));
  return schemaValidation(props, apprenantSchema, [
    {
      name: "courriel",
      base: Joi.string().email(),
    },
  ]);
}
