import {
  CODES_STATUT_APPRENANT,
  SEXE_APPRENANT_ENUM,
  CODE_POSTAL_REGEX,
  DERNIER_ORGANISME_UAI_REGEX,
  zEffectifDernierSituation,
} from "../../../constants";
import { zodLiteralUnion } from "../../../utils/zodHelper";
import { zAdresse, zAdresseWithMissionLocale } from "../../parts/adresseSchema";
import { extensions } from "../../parts/zodPrimitives";
import { zodOpenApi } from "../../zodOpenApi";

export const zApprenant = zodOpenApi.object({
  ine: zodOpenApi
    .string({
      description: "N° INE de l'apprenant",
    })
    .openapi({ example: "0494004062M" })
    .nullish(),
  nom: zodOpenApi.string({ description: "Nom de l'apprenant" }).min(1),
  prenom: zodOpenApi.string({ description: "Prénom de l'apprenant" }).min(1),
  sexe: zodOpenApi
    .enum(SEXE_APPRENANT_ENUM, {
      description: "Sexe de l'apprenant (M: Homme, F: Femme)",
    })
    .nullish(),
  date_de_naissance: zodOpenApi.date({ description: "Date de naissance de l'apprenant" }).nullish(),
  code_postal_de_naissance: zodOpenApi
    .string({
      description:
        "Le code postal doit contenir 5 caractères.  \nPour les jeunes résidents à l’étranger, il conviendra de mettre « 99 » suivi du numéro de pays.  \n*Exemple : pour l’Allemagne le code pays est 109, il conviendra donc de saisir : « 99109 »*",
    })
    .openapi({ example: "75001" })
    .regex(CODE_POSTAL_REGEX)
    .nullish(),
  nationalite: zodOpenApi
    .union([zodOpenApi.literal(1), zodOpenApi.literal(2), zodOpenApi.literal(3)], {
      description: "Apprenant étranger, non citoyen européen",
    })
    .nullish(),
  regime_scolaire: zodOpenApi
    .enum(["I", "D", "E", "IE"], {
      description: "Régime scolaire (I : Interne, D : Demi-pensionnaire, E : Externe, IE : Interne externé)",
    })
    .nullish(),
  rqth: zodOpenApi
    .boolean({
      description: "Apprenant en situation d'handicape (RQTH)",
    })
    .nullish(),
  date_rqth: zodOpenApi
    .date({
      description: "Date de la reconnaissance travailleur handicapé",
    })
    .nullish(),
  affelnet: zodOpenApi
    .array(
      zodOpenApi.string({
        description: "voeux affelnet de l'apprenant", //  a priori, CMEs (clé ministère éducatif), à confirmer
      })
    )
    .nullish(),
  parcoursup: zodOpenApi
    .array(
      zodOpenApi.string({
        description: "voeux parcoursup de l'apprenant", //  a priori, CMEs (clé ministère éducatif), à confirmer
      })
    )
    .nullish(),
  inscription_sportif_haut_niveau: zodOpenApi
    .boolean({
      description:
        "Apprenant inscrit sur la liste des sportifs, entraîneurs, arbitres et juges sportifs de haut niveau",
    })
    .nullish(),
  courriel: zodOpenApi.string({ description: "Adresse mail de contact de l'apprenant" }).nullish(),
  telephone: extensions.phone().nullish(),

  adresse: zAdresseWithMissionLocale.nullish(),
  adresse_naissance: zAdresseWithMissionLocale.nullish(),
  historique_statut: zodOpenApi.array(
    zodOpenApi.object({
      valeur_statut: zodOpenApi.nativeEnum(CODES_STATUT_APPRENANT, {
        description: "Statut de l'apprenant",
      }),
      date_statut: zodOpenApi.date(),
      date_reception: zodOpenApi.date().nullish(),
      abandon_forced: zodOpenApi
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
  derniere_situation: zEffectifDernierSituation.describe("Situation de l'apprenant N-1").nullish(),
  dernier_organisme_uai: zodOpenApi
    .string({
      description: `Numéro UAI de l’établissement fréquenté l’année dernière (N-1), si déjà en apprentissage, mettre l’UAI du site de formation
      ou département.   \n* Pour les apprentis en emploi l'année dernière, le numéro UAI n-1 à indiquer est le **995** qui signifie "Non concerné".
         \n* Si cette information n'est pas connue, le numéro UAI n-1 à indiquer est le **993** qui signifie "Inconnu" `,
    })
    .regex(DERNIER_ORGANISME_UAI_REGEX)
    .nullish(),
  type_cfa: zodOpenApi
    .enum(["01", "02", "03", "04", "05", "06", "07", "08", "09", "10"], {
      description: "Type de CFA",
    })
    .nullish(),

  dernier_diplome: zodLiteralUnion([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 99], {
    description: "Dernier diplôme obtenu",
  }).nullish(),
  mineur: zodOpenApi
    .boolean({
      description: "l'apprenant(e) sera-t-il(elle) mineur(e) ? (calc)",
    })
    .nullish(),
  mineur_emancipe: zodOpenApi
    .boolean({
      description: "Un mineur émancipé peut accomplir seul les actes nécessitant la majorité légale.", // Plus d'informations à propos de l'émancipation sur [le site du Service public.](https://www.service-public.fr/particuliers/vosdroits/F1194)
    })
    .nullish(),
  representant_legal: zodOpenApi
    .object({
      nom: zodOpenApi.string({ description: "Nom du representant légal" }).nullish(),
      prenom: zodOpenApi.string({ description: "Prénom du representant légal" }).nullish(),
      meme_adresse: zodOpenApi
        .boolean({
          description: "l'apprenti(e) vit à la même adresse que son representant légal",
        })
        .nullish(),
      adresse: zAdresse.nullish(),
      courriel: zodOpenApi.string({ description: "Adresse mail de contact du representant légal" }).nullish(),
      telephone: extensions.phone().nullish(),
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
  has_nir: zodOpenApi
    .boolean({
      description: "Numéro de sécurité sociale de l'apprenant",
    })
    .nullish(),
  responsable_mail1: zodOpenApi
    .string({
      description: "Adresse mail du responsable 1",
    })
    .nullish(),
  responsable_mail2: zodOpenApi
    .string({
      description: "Adresse mail du responsable 2",
    })
    .nullish(),
  organisme_gestionnaire: zodOpenApi
    .number({
      description: "Relicat déprécié et non utilisé",
    })
    .nullish(),
  custom_statut_apprenant: zodOpenApi
    .string()
    .openapi({
      description: "Champ libre décrivant le statut de l'apprenant",
    })
    .nullish(),
});
