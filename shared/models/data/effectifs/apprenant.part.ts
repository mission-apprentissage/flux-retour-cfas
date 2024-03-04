import { z } from "zod";

import {
  CODES_STATUT_APPRENANT,
  EFFECTIF_DERNIER_SITUATION,
  SEXE_APPRENANT_ENUM,
  CODE_POSTAL_REGEX,
  DERNIER_ORGANISME_UAI_REGEX,
} from "../../../constants";
import { zodLiteralUnion } from "../../../utils/zodHelper";
import { zAdresse } from "../../parts/adresseSchema";

export const zApprenant = z.object({
  ine: z
    .string({
      description: "N° INE de l'apprenant",
    })
    .openapi({ example: "0494004062M" })
    .nullish(),
  nom: z.string({ description: "Nom de l'apprenant" }).min(1),
  prenom: z.string({ description: "Prénom de l'apprenant" }).min(1),
  sexe: z
    .enum(SEXE_APPRENANT_ENUM, {
      description: "Sexe de l'apprenant (M: Homme, F: Femme)",
    })
    .nullish(),
  date_de_naissance: z.date({ description: "Date de naissance de l'apprenant" }).nullish(),
  code_postal_de_naissance: z
    .string({
      description:
        "Le code postal doit contenir 5 caractères.  \nPour les jeunes résidents à l’étranger, il conviendra de mettre « 99 » suivi du numéro de pays.  \n*Exemple : pour l’Allemagne le code pays est 109, il conviendra donc de saisir : « 99109 »*",
    })
    .openapi({ example: "75000" })
    .regex(CODE_POSTAL_REGEX)
    .nullish(),
  nationalite: z
    .union([z.literal(1), z.literal(2), z.literal(3)], {
      description: "Apprenant étranger, non citoyen européen",
    })
    .nullish(),
  regime_scolaire: z
    .enum(["I", "D", "E", "IE"], {
      description: "Régime scolaire (I : Interne, D : Demi-pensionnaire, E : Externe, IE : Interne externé)",
    })
    .nullish(),
  rqth: z
    .boolean({
      description: "Apprenant en situation d'handicape (RQTH)",
    })
    .nullish(),
  date_rqth: z
    .date({
      description: "Date de la reconnaissance travailleur handicapé",
    })
    .nullish(),
  affelnet: z
    .array(
      z.string({
        description: "voeux affelnet de l'apprenant", //  a priori, CMEs (clé ministère éducatif), à confirmer
      })
    )
    .nullish(),
  parcoursup: z
    .array(
      z.string({
        description: "voeux parcoursup de l'apprenant", //  a priori, CMEs (clé ministère éducatif), à confirmer
      })
    )
    .nullish(),
  inscription_sportif_haut_niveau: z
    .boolean({
      description:
        "Apprenant inscrit sur la liste des sportifs, entraîneurs, arbitres et juges sportifs de haut niveau",
    })
    .nullish(),
  courriel: z.string({ description: "Adresse mail de contact de l'apprenant" }).nullish(),
  telephone: z
    .string({
      description: "Téléphone de l'apprenant", // Dans le cas d'un numéro français, il n'est pas nécessaire de saisir le "0" car l'indicateur pays est pré-renseigné. Il doit contenir 9 chiffres après l'indicatif.,
    })
    .openapi({ example: "+33908070605" })
    .regex(/^([+])?(\d{7,12})$/)
    .nullish(),
  adresse: zAdresse.nullish(),
  historique_statut: z.array(
    z.object({
      valeur_statut: z.nativeEnum(CODES_STATUT_APPRENANT, {
        description: "Statut de l'apprenant",
      }),
      date_statut: z.date(),
      date_reception: z.date().nullish(),
      abandon_forced: z
        .boolean({
          description: "Le statut a été forcé en abandon",
        })
        .nullish(),
    }),
    {
      description: "Historique du statut de l'apprenant",
    }
  ),
  situation_avant_contrat: zodLiteralUnion([11, 12, 21, 31, 41, 51, 52, 53, 54, 90, 99], {
    description: "Situation de l'apprenant avant le contrat",
  }).nullish(),
  derniere_situation: zodLiteralUnion(EFFECTIF_DERNIER_SITUATION, {
    description: "Situation de l'apprenant N-1",
  }).nullish(),
  dernier_organisme_uai: z
    .string({
      description: `Numéro UAI de l’établissement fréquenté l’année dernière (N-1), si déjà en apprentissage, mettre l’UAI du site de formation
      ou département.   \n* Pour les apprentis en emploi l'année dernière, le numéro UAI n-1 à indiquer est le **995** qui signifie "Non concerné".
         \n* Si cette information n'est pas connue, le numéro UAI n-1 à indiquer est le **993** qui signifie "Inconnu" `,
    })
    .regex(DERNIER_ORGANISME_UAI_REGEX)
    .nullish(),
  type_cfa: z
    .enum(["01", "02", "03", "04", "05", "06", "07", "08", "09", "10"], {
      description: "Type de CFA",
    })
    .nullish(),

  dernier_diplome: zodLiteralUnion([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 99], {
    description: "Dernier diplôme obtenu",
  }).nullish(),
  mineur: z
    .boolean({
      description: "l'apprenant(e) sera-t-il(elle) mineur(e) ? (calc)",
    })
    .nullish(),
  mineur_emancipe: z
    .boolean({
      description: "Un mineur émancipé peut accomplir seul les actes nécessitant la majorité légale.", // Plus d'informations à propos de l'émancipation sur [le site du Service public.](https://www.service-public.fr/particuliers/vosdroits/F1194)
    })
    .nullish(),
  representant_legal: z
    .object({
      nom: z.string({ description: "Nom du representant légal" }).nullish(),
      prenom: z.string({ description: "Prénom du representant légal" }).nullish(),
      meme_adresse: z
        .boolean({
          description: "l'apprenti(e) vit à la même adresse que son representant légal",
        })
        .nullish(),
      adresse: zAdresse.nullish(),
      courriel: z.string({ description: "Adresse mail de contact du representant légal" }).nullish(),
      telephone: z
        .string({
          description: `Dans le cas d'un numéro français, il n'est pas
    nécessaire de saisir le "0" car l'indicateur pays est
    pré-renseigné.
    Il doit contenir 9 chiffres après l'indicatif.`,
        })
        .openapi({ example: "+33908070605" })
        .regex(/^([+])?(\d{7,12})$/)
        .nullish(),
      pcs: zodLiteralUnion(
        [
          10, 21, 22, 23, 31, 33, 34, 37, 38, 42, 43, 44, 45, 46, 47, 48, 52, 53, 54, 55, 56, 61, 66, 69, 71, 72, 73,
          76, 81, 82, 99,
        ],
        {
          description: "Nomenclatures des professions et catégories socioprofessionnelles",
        }
      ).nullish(),
    })
    .nullish(),
  // V3 fields
  has_nir: z
    .boolean({
      description: "Numéro de sécurité sociale de l'apprenant",
    })
    .nullish(),
  responsable_mail1: z
    .string({
      description: "Adresse mail du responsable 1",
    })
    .nullish(),
  responsable_mail2: z
    .string({
      description: "Adresse mail du responsable 2",
    })
    .nullish(),
  organisme_gestionnaire: z
    .number({
      description: "Relicat déprécié et non utilisé",
    })
    .nullish(),
});
