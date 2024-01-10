import {
  CODES_STATUT_APPRENANT,
  EFFECTIF_DERNIER_SITUATION,
  NATIONALITE_APPRENANT_ENUM,
  SEXE_APPRENANT_ENUM,
  CODE_POSTAL_PATTERN,
  DERNIER_ORGANISME_UAI_PATTERN,
  object,
  string,
  date,
  integer,
  boolean,
  arrayOf,
  adresseSchema,
} from "shared";

import { Effectif } from "../../@types";

export const apprenantSchema = object(
  {
    ine: string({
      description: "N° INE de l'apprenant",
      example: "0494004062M",
    }),
    nom: string({ description: "Nom de l'apprenant", pattern: "^.+$" }),
    prenom: string({ description: "Prénom de l'apprenant", pattern: "^.+$" }),
    sexe: string({
      description: "Sexe de l'apprenant (M: Homme, F: Femme)",
      enum: SEXE_APPRENANT_ENUM,
    }),
    date_de_naissance: date({ description: "Date de naissance de l'apprenant" }),
    code_postal_de_naissance: string({
      description: "Le code postal doit contenir 5 caractères",
      example: "75000",
      pattern: CODE_POSTAL_PATTERN,
      maxLength: 5,
      minLength: 5,
    }),
    nationalite: integer({
      description: "Apprenant étranger, non citoyen européen",
      enum: NATIONALITE_APPRENANT_ENUM,
    }),
    regime_scolaire: string({
      description: "Régime scolaire (I : Interne, D : Demi-pensionnaire, E : Externe, IE : Interne externé)",
      enum: ["I", "D", "E", "IE"],
    }),
    rqth: boolean({
      description: "Apprenant en situation d'handicape (RQTH)",
    }),
    date_rqth: date({
      description: "Date de la reconnaissance travailleur handicapé",
    }),
    affelnet: arrayOf(
      string({
        description: "voeux affelnet de l'apprenant", //  a priori, CMEs (clé ministère éducatif), à confirmer
      })
    ),
    parcoursup: arrayOf(
      string({
        description: "voeux parcoursup de l'apprenant", //  a priori, CMEs (clé ministère éducatif), à confirmer
      })
    ),
    inscription_sportif_haut_niveau: boolean({
      description:
        "Apprenant inscrit sur la liste des sportifs, entraîneurs, arbitres et juges sportifs de haut niveau",
    }),
    courriel: string({ description: "Adresse mail de contact de l'apprenant" }),
    telephone: string({
      description: "Téléphone de l'apprenant", // Dans le cas d'un numéro français, il n'est pas nécessaire de saisir le "0" car l'indicateur pays est pré-renseigné. Il doit contenir 9 chiffres après l'indicatif.,
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
            description: "Statut de l'apprenant",
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
      description: "Situation de l'apprenant avant le contrat",
    }),
    derniere_situation: integer({
      enum: EFFECTIF_DERNIER_SITUATION,
      description: "Situation de l'apprenant N-1",
    }),
    dernier_organisme_uai: string({
      description:
        "Numéro UAI de l’établissement fréquenté l’année dernière (N-1), si déjà en apprentissage, mettre l’UAI du site de formation ou département",
      pattern: DERNIER_ORGANISME_UAI_PATTERN,
    }),
    type_cfa: string({
      enum: ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10"],
      description: "Type de CFA",
    }),

    dernier_diplome: integer({
      enum: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 99],
      description: "Dernier diplôme obtenu",
    }),
    mineur: boolean({
      description: "l'apprenant(e) sera-t-il(elle) mineur(e) ? (calc)",
    }),
    mineur_emancipe: boolean({
      description: "Un mineur émancipé peut accomplir seul les actes nécessitant la majorité légale.", // Plus d'informations à propos de l'émancipation sur [le site du Service public.](https://www.service-public.fr/particuliers/vosdroits/F1194)
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
        description: "Nomenclatures des professions et catégories socioprofessionnelles",
      }),
    }),
    // V3 fields
    nir: string({
      description: "Numéro de sécurité sociale de l'apprenant",
    }),
    responsable_mail1: string({
      description: "Adresse mail du responsable 1",
    }),
    responsable_mail2: string({
      description: "Adresse mail du responsable 2",
    }),
  },
  {
    required: ["nom", "prenom", "historique_statut"],
    additionalProperties: true,
  }
);

// Default value
export function defaultValuesApprenant(): { historique_statut: Effectif["apprenant"]["historique_statut"] } {
  return {
    historique_statut: [],
  };
}
