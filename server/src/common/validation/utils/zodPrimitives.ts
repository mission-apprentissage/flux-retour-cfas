import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { subDays } from "date-fns";
import { capitalize } from "lodash-es";
import {
  CODES_STATUT_APPRENANT_ENUM,
  EFFECTIF_DERNIER_SITUATION,
  CFD_REGEX,
  CODE_NAF_REGEX,
  RNCP_REGEX,
  SIRET_REGEX,
  UAI_REGEX,
  CODE_POSTAL_REGEX,
  DERNIER_ORGANISME_UAI_REGEX,
} from "shared";
import { z } from "zod";

import { telephoneConverter } from "./frenchTelephoneNumber";

extendZodWithOpenApi(z);

// custom error map to translate zod errors to french
const customErrorMap: z.ZodErrorMap = (issue, ctx) => {
  if (issue.code === z.ZodIssueCode.invalid_type) {
    return { message: `${capitalize(issue.expected)} attendu` };
  }
  return { message: ctx.defaultError };
};
z.setErrorMap(customErrorMap);

const currentYear = new Date().getFullYear();
const aMonthAgo = subDays(new Date(), 30);
const sixMonthAgo = subDays(new Date(), 30 * 6);

const iso8601Regex = /^([0-9]{4})-([0-9]{2})-([0-9]{2})/;

export const extensions = {
  phone: () =>
    z.coerce
      .string()
      // On va vérifier que ça contient au moins un chiffre (ou que c'est une chaine vide, car on les accepte aussi)
      .regex(/^$|.*[0-9].*/, "Format invalide")
      // On passe à null en cas de chaine vide
      .transform((v: string) => (v ? telephoneConverter(v) : null))
      .openapi({
        example: "0628000000",
      }),
  siret: () =>
    z.preprocess(
      // On accepte les tirets, les espaces et les points dans le SIRET (et on les retire silencieusement)
      (v: any) => (v ? String(v).replace(/[\s.-]+/g, "") : v),
      z.string().trim().regex(SIRET_REGEX, "Siret invalide. Format attendu : 14 chiffres") // e.g 01234567890123
    ),
  uai: () => z.string().trim().toUpperCase().regex(UAI_REGEX, "UAI invalide"), // e.g 0123456B
  code_naf: () =>
    z.preprocess(
      (v: any) => (v ? String(v.replace(".", "")) : v), // parfois, le code naf contient un point
      z.string().trim().toUpperCase().regex(CODE_NAF_REGEX, "CODE NAF invalide") // e.g 1071D
    ),
  iso8601Date: () =>
    z
      .preprocess(
        (v: any) => (typeof v === "string" && v.match(iso8601Regex) ? new Date(v.trim()) : v),
        z.date({
          invalid_type_error: "Date invalide",
          required_error: "Champ obligatoire",
        })
      )
      .openapi({
        type: "string",
        format: "YYYY-MM-DD",
      }),
  iso8601Datetime: () =>
    z
      .preprocess(
        (v: any) => (typeof v === "string" && v.match(iso8601Regex) ? new Date(v.trim()) : v),
        z.date({
          invalid_type_error: "Date invalide",
          required_error: "Champ obligatoire",
        })
      )
      .openapi({
        type: "string",
        format: "YYYY-MM-DDT00:00:00Z",
      }),
  codeCommuneInsee: () =>
    z.preprocess((v: any) => (v ? String(v) : v), z.string().regex(/^([0-9]{2}|2A|2B)[0-9]{3}$/, "Format invalide")),
};

export const primitivesV1 = {
  source: z.string().min(1), // configured by API
  source_organisme_id: z.string().min(1), // configured by API
  api_version: z.union([z.literal("v1"), z.literal("v2"), z.literal("v3"), z.literal(""), z.null()]), // configured by API
  apprenant: {
    nom: z.string().trim().min(1).toUpperCase().openapi({
      description: "nom de l'apprenant",
      example: "Lenôtre",
    }),
    prenom: z.string().trim().min(1).openapi({
      description: "prénom de l'apprenant",
      example: "Gaston",
    }),
    date_de_naissance: extensions.iso8601Date().openapi({
      type: "string",
      description: "Date de naissance de l'apprenant, au format ISO-8601",
      example: "2000-10-28T00:00:00.000Z",
    }),
    statut: z
      .preprocess(
        (v: any) => (CODES_STATUT_APPRENANT_ENUM.includes(parseInt(v, 10) as any) ? parseInt(v, 10) : v),
        z
          .number({
            invalid_type_error: `Valeurs possibles: ${CODES_STATUT_APPRENANT_ENUM.join(",")}`,
          })
          .int()
          .refine((value) => (CODES_STATUT_APPRENANT_ENUM as number[]).includes(value), {
            message: `Valeurs valides: ${CODES_STATUT_APPRENANT_ENUM.join(",")}`,
          })
      )
      .openapi({
        description: `Valeurs possibles: ${CODES_STATUT_APPRENANT_ENUM.join(",")}`,
        enum: CODES_STATUT_APPRENANT_ENUM,
        type: "integer",
      }),
    date_metier_mise_a_jour_statut: extensions.iso8601Datetime().openapi({
      description: "Date de dernière mise à jour du statut de l'apprenant, au format ISO-8601",
    }),
    id_erp: z.preprocess(
      (v: any) => (v ? String(v) : v),
      z.string().trim().describe("Identifiant de l'apprenant dans l'ERP")
    ),
    ine: z.preprocess(
      (v: any) => (v ? String(v) : v),
      z.string().trim().toUpperCase().describe("Identifiant National Élève de l'apprenant")
    ),
    email: z.string().trim().email("Email non valide").describe("Email de l'apprenant").openapi({
      example: "gaston.lenotre@domain.tld",
    }),
    telephone: extensions.phone().describe("Téléphone de l'apprenant"),
    code_commune_insee: extensions.codeCommuneInsee().describe("Code Insee de la commune de résidence de l'apprenant"),
  },
  etablissement_responsable: {
    nom: z.string().trim().openapi({
      description: "Nom l'établissement responsable",
    }),
    uai: extensions.uai().openapi({
      description: "UAI apprentissage de l'établissement responsable",
      example: "0123456A",
    }),
    siret: extensions.siret().openapi({
      description: "SIRET de l'établissement responsable",
      example: "19750655300019",
    }),
    code_commune_insee: extensions.codeCommuneInsee().openapi({
      description: "Code Insee de la commune de l'établissement responsable",
    }),
  },
  etablissement_formateur: {
    nom: z.string().trim().openapi({
      description: "Nom l'établissement formateur",
    }),
    uai: extensions.uai().openapi({
      description: "UAI apprentissage de l'établissement formateur",
      example: "0123456A",
    }),
    siret: extensions.siret().openapi({
      description: "SIRET de l'établissement formateur",
      example: "19750655300019",
    }),
    code_commune_insee: extensions.codeCommuneInsee().openapi({
      description: "Code Insee de la commune de l'établissement formateur",
    }),
  },
  etablissement_lieu_de_formation: {
    nom: z.string().trim().openapi({
      description: "Nom l'établissement (lieu de formation)",
    }),
    uai: extensions.uai().openapi({
      description: "UAI apprentissage de l'établissement (lieu de formation)",
      example: "0123456A",
    }),
    siret: extensions.siret().openapi({
      description: "SIRET de l'établissement (lieu de formation)",
      example: "19750655300019",
    }),
    code_commune_insee: extensions.codeCommuneInsee().openapi({
      description: "Code Insee de la commune de l'établissement (lieu de formation)",
    }),
  },

  formation: {
    code_rncp: z
      .preprocess(
        // certains organismes n'envoient pas le prefix RNCP
        (v: any) => {
          const sanitized = v
            ?.toString()
            .trim()
            .toUpperCase()
            .replace(/[\s.-]+/g, "");
          return sanitized?.startsWith("RNCP") ? sanitized : `RNCP${sanitized}`;
        },
        z.string().toUpperCase().regex(RNCP_REGEX, "Code RNCP invalide")
      )
      .openapi({
        description: "Code RNCP de la formation",
        examples: ["RNCP35316", "35316"],
      }),
    code_cfd: z.coerce.string().trim().toUpperCase().regex(CFD_REGEX, "Code CFD invalide").openapi({
      example: "50022141",
      description: "Code Formation Diplôme (CFD)", // aussi appelé id_formation
    }),
    libelle_court: z.string().trim().min(2).describe("Libellé court de la formation").openapi({
      description: "Libellé court de la formation",
      example: "CAP PATISSIER",
    }),
    libelle_long: z.string().min(2).trim().describe("Libellé complet de la formation").openapi({
      example: "CAP PATISSIER",
    }),
    periode: z
      .preprocess(
        // periode is sent as string "year1-year2" i.e. "2020-2022", we transform it to [2020,2022]
        (v: any) => (typeof v === "string" ? v.trim().split("-").map(Number) : v),
        z.array(z.number().int().min(2000).max(2100)).length(2)
      )
      .describe("Période de la formation, en année (peut être sur plusieurs années)")
      .openapi({
        type: "string",
        example: `${currentYear - 2}-${currentYear + 1}` as any,
      }),
    annee_scolaire: z.preprocess(
      // On accepte les "/" et espaces dans l'année scolaire (et on les retire silencieusement)
      (v: any) => (v ? String(v).replace(/\//g, "-").replaceAll(" ", "") : v),
      z
        .string()
        .trim()
        .refine(
          (value) => {
            const match = value.match(/^([12][0-9]{3})-([12][0-9]{3})$/);
            if (match) {
              const [, year1, year2] = match;
              const year1Num = parseInt(year1, 10);
              const year2Num = parseInt(year2, 10);
              return year1Num === year2Num || year1Num + 1 === year2Num;
            }
            return false;
          },
          {
            message:
              "Format invalide (format attendu : 2023-2024). Les années doivent être consécutives ou identiques (ex : 2023-2024 ou 2023-2023)",
          }
        )
        .describe("Période scolaire")
        .openapi({
          type: "string",
          examples: [`${currentYear - 1}-${currentYear}`, `${currentYear}-${currentYear}`] as any,
        })
    ),
    annee: z.preprocess(
      (v: any) => (v ? Number(v) : v),
      z
        .number()
        .int()
        .min(0)
        .max(5, "Le chiffre doit être inférieur ou égal à 5")
        .describe("Année de la formation")
        // TO_DISCUSS: à quoi correspond l'année 0 ?
        .openapi({
          enum: [0, 1, 2, 3, 4, 5],
          type: "integer",
        })
    ),
  },
  contrat: {
    date_debut: extensions
      .iso8601Date()
      .describe("Date de début de contrat de l'apprenant, au format ISO-8601")
      .openapi({
        example: sixMonthAgo.toISOString(),
      }),
    date_fin: extensions.iso8601Date().describe("Date de fin de contrat de l'apprenant, au format ISO-8601").openapi({
      example: aMonthAgo.toISOString(),
    }),
    date_rupture: extensions
      .iso8601Date()
      .describe("Date de rupture du contrat de l'apprenant, au format ISO-8601")
      .openapi({
        example: aMonthAgo.toISOString(),
      }),
  },
};

export const primitivesV3 = {
  apprenant: {
    has_nir: z.boolean(),
    adresse: z.string().trim().describe("Adresse de l'apprenant"),
    code_postal: z.preprocess(
      (v: any) => (v ? String(v).trim().padStart(5, "0") : v),
      z
        .string()
        .trim()
        .regex(CODE_POSTAL_REGEX, "Le code postal doit faire 5 caractères numériques exactement")
        .describe("Code postal de l'apprenant")
    ),
    sexe: z.preprocess(
      (v: any) => (v ? String(v).trim().replace("H", "M").replace("1", "M").replace("2", "F") : v),
      z
        .string()
        .trim()
        .regex(/^[MF]$/, "M, H ou F attendu")
        .describe("Sexe de l'apprenant")
        .openapi({
          example: "M",
        })
    ),
    rqth: z.boolean().describe("Reconnaissance de la Qualité de Travailleur Handicapé").openapi({ example: true }),
    date_rqth: extensions
      .iso8601Date()
      .describe("Date de la reconnaissance travailleur handicapé")
      .openapi({ example: "2010-10-28T00:00:00.000Z" }),
  },
  responsable: {
    email: z
      .string()
      .trim()
      .email("Email non valide")
      .describe("Email du responsable de l'apprenant")
      .openapi({ example: "escoffier@domain.tld" }),
  },
  etablissement_formateur: {
    siret: extensions.siret().openapi({
      description: "SIRET de l'établissement formateur",
    }),
  },
  formation: {
    obtention_diplome: z.boolean().openapi({
      description: "L'apprenant a obtenu son diplôme sur la formation donnée",
      example: true,
    }),
    date_obtention_diplome: extensions.iso8601Date().openapi({
      description: "Date de l'obtention du diplôme de l'apprenant, au format ISO-8601",
      example: aMonthAgo.toISOString(),
    }),
    date_entree: extensions.iso8601Date().openapi({
      description: "Date d'entrée de l'apprenant dans la formation, au format ISO-8601",
      example: sixMonthAgo.toISOString(),
    }),
    date_inscription: extensions.iso8601Date().openapi({
      description: "Date d'inscription de l'apprenant dans la formation, au format ISO-8601",
    }),
    date_fin: extensions.iso8601Date().openapi({
      description: "Date de fin de la formation, au format ISO-8601",
      example: aMonthAgo.toISOString(),
    }),
    duree_theorique: z.preprocess(
      (v: any) => (v ? Number(v) : v),
      z
        .number()
        .int()
        .min(1, "Le chiffre doit être supérieur ou égal à 1")
        .max(4, "Le chiffre doit être inférieur ou égal à 4")
        .describe("Durée théorique de la formation en années")
    ),
    duree_theorique_mois: z.preprocess(
      (v: any) => (v ? Number(v) : v),
      z
        .number()
        .int()
        .min(1, "Le chiffre doit être supérieur ou égal à 1")
        .max(48, "Le chiffre doit être inférieur ou égal à 48")
        .describe("Durée théorique de la formation en mois")
    ),
    date_exclusion: extensions.iso8601Date().openapi({
      description: "Date d'exclusion de l'apprenant de la formation, au format ISO-8601",
      example: aMonthAgo.toISOString(),
    }),
    cause_exclusion: z.string().openapi({
      description: "Cause de l'exclusion de l'apprenant de la formation",
      examples: [
        "absences répétées et injustifiées",
        "cessation du travail et abandon des cours",
        "non respect des règles de sécurité",
      ],
    }),
    referent_handicap: {
      nom: z.string().openapi({
        description: "Nom du référent handicap de la formation",
      }),
      prenom: z.string().openapi({
        description: "Prénom du référent handicap de la formation",
      }),
      email: z.string().email("Email non valide").openapi({
        description: "Email du référent handicap de la formation",
      }),
    },
    // date_declaration_1ere_absence: TODO? (a priori diversement disponible)
    // date_declaration_2e_absence: TODO? (a priori diversement disponible)
    presentielle: z.boolean().describe("Formation 100% à distance ou non").openapi({ example: true }),
  },
  contrat: {
    cause_rupture: z
      .string()
      .describe("Cause de la rupture du contrat de l'apprenant")
      .openapi({
        examples: [
          "démission",
          "résiliation",
          "force majeure",
          "obtention du diplôme",
          "faute lourde",
          "inaptitude constatée par la médecine du travail",
        ],
      }),
    // date_declaration_1ere_absence: TODO? (a priori non disponible)
    // date_declaration_2e_absence: TODO? (a priori non disponible)
  },
  employeur: {
    siret: extensions.siret().describe("SIRET de l'employeur"),
    code_commune_insee: extensions
      .codeCommuneInsee()
      .describe("Code Insee de la commune de l'établissement de l'employeur"),
    code_naf: extensions.code_naf().describe("Code NAF de l'employeur").openapi({ example: "1071D" }),
  },
  derniere_situation: z
    .preprocess(
      (v: any) => (v ? Number(v) : v),
      z.coerce
        .number()
        .int()
        .refine((e) => EFFECTIF_DERNIER_SITUATION.includes(e as any), {
          message: "Format invalide (ex : 1003, 3111, 4017)",
        })
    )
    .describe("Situation de l'apprenant N-1")
    .openapi({
      type: "integer",
      enum: EFFECTIF_DERNIER_SITUATION as any,
    }),
  dernier_organisme_uai: z
    .string()
    .regex(DERNIER_ORGANISME_UAI_REGEX, "UAI ou département")
    .describe(
      "Numéro UAI de l’établissement fréquenté l’année dernière (N-1), si déjà en apprentissage, mettre l’UAI du site de formation ou département"
    )
    .openapi({
      example: "0123456A",
    }),
  type_cfa: z.preprocess(
    (input) => {
      if (input) {
        // Vérifie si l'entrée est un nombre entre 1 et 10 sans le zéro initial
        const match = String(input).match(/^(1|2|3|4|5|6|7|8|9|10)$/);
        if (match) {
          // Rajoute un zéro devant si nécessaire
          return match[0].length === 1 ? "0" + match[0] : match[0];
        }
      }
      return input;
    },
    z
      .string()
      .regex(/^(01|02|03|04|05|06|07|08|09|10)$/, "01 à 10")
      .describe("Type de CFA")
      .openapi({
        enum: ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10"],
        description: "Type de CFA",
      })
  ),
};
