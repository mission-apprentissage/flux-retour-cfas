import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { subDays } from "date-fns";
import { capitalize } from "lodash-es";
import { z } from "zod";

import { CODES_STATUT_APPRENANT_ENUM, SEXE_APPRENANT_ENUM } from "@/common/constants/dossierApprenant";
import {
  CFD_REGEX,
  CODE_NAF_REGEX,
  RNCP_REGEX,
  SIRET_REGEX,
  UAI_REGEX,
  YEAR_RANGE_REGEX,
  INE_REGEX,
  NIR_LOOSE_REGEX,
  ZOD_3_22_2_EMAIL_REGEX_PATTERN,
} from "@/common/constants/validations";

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

const extensions = {
  phone: () =>
    z.preprocess(
      (v: any) => telephoneConverter(v),
      z
        .string()
        .regex(/.*[0-9].*/, "Format invalide") // check it contains at least one digit
        .openapi({
          example: "0628000000",
        })
    ),
  siret: () =>
    z.preprocess(
      // On accepte les tirets, les espaces et les points dans le SIRET (et on les retire silencieusement)
      (v: any) => (v ? String(v).replace(/[\s.-]+/g, "") : v),
      z.string().trim().regex(SIRET_REGEX, "SIRET invalide") // e.g 01234567890123
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
          .number({ invalid_type_error: `Valeurs possibles: ${CODES_STATUT_APPRENANT_ENUM.join(",")}` })
          .int()
          .min(0)
          .max(3)
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
      z
        .string()
        .trim()
        .toUpperCase()
        .regex(INE_REGEX, "INE invalide")
        .describe("Identifiant National Élève de l'apprenant")
    ),
    email: z
      .string()
      .trim()
      .regex(ZOD_3_22_2_EMAIL_REGEX_PATTERN, "Email non valide")
      .describe("Email de l'apprenant")
      .openapi({
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
        (v: any) => (v?.toString().trim().toUpperCase().startsWith("RNCP") ? v : `RNCP${v}`),
        z.string().toUpperCase().regex(RNCP_REGEX, "Code RNCP invalide")
      )
      .openapi({
        description: "Code RNCP de la formation",
        examples: ["RNCP35316", "35316"],
      }),
    code_cfd: z.preprocess(
      (v: any) => (v ? String(v) : v),
      z.string().trim().toUpperCase().regex(CFD_REGEX, "Code CFD invalide").openapi({
        example: "50022141",
        description: "Code Formation Diplôme (CFD)", // aussi appelé id_formation
      })
    ),
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
      // On accepte les "/" dans l'année scolaire (et on les retire silencieusement)
      (v: any) => (v ? String(v).replace(/\//g, "-") : v),
      z
        .string()
        .trim()
        .regex(YEAR_RANGE_REGEX, "Format invalide (format attendu : 2023-2024)")
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
        .max(5)
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
    nir: z.preprocess(
      (v: any) => (v ? String(v) : v),
      z
        .string()
        .trim()
        // On indique juste "13 chiffres attendus", car ça ne devrait pas être 15 (on répare silencieusement quand même à la ligne suivante)
        .regex(NIR_LOOSE_REGEX, "NIR invalide (13 chiffres attendus)")
        .transform((value) => {
          if (value.length === 15) {
            return value.slice(0, -2);
          }
          return value;
        })
        .describe("NIR de l'apprenant")
        .openapi({
          example: "1234567890123",
          type: "string",
        })
    ),
    adresse: z.string().trim().describe("Adresse de l'apprenant"),
    code_postal: z.preprocess(
      (v: any) => (v ? String(v) : v),
      z.string().trim().describe("Code postal de l'apprenant")
    ),
    sexe: z.preprocess(
      (v: any) => (v ? String(v).trim().replace("H", "M").replace("1", "M").replace("2", "F") : v),
      z
        .string()
        .trim()
        .regex(/^[MF]$/, "M, H ou F attendu")
        .describe("Sexe de l'apprenant")
        .openapi({
          enum: SEXE_APPRENANT_ENUM,
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
      .regex(ZOD_3_22_2_EMAIL_REGEX_PATTERN, "Email non valide")
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
      z.number().int().min(1).max(4).describe("Durée théorique de la formation")
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
      email: z.string().regex(ZOD_3_22_2_EMAIL_REGEX_PATTERN, "Email non valide").openapi({
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
};
