import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { subDays } from "date-fns";
import { capitalize } from "lodash-es";
import { z } from "zod";

import { CODES_STATUT_APPRENANT_ENUM, SEXE_APPRENANT_ENUM } from "@/common/constants/dossierApprenant";
import { CFD_REGEX, RNCP_REGEX, SIRET_REGEX, UAI_REGEX } from "@/common/constants/organisme";

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

const extensions = {
  siret: () => z.string().regex(SIRET_REGEX, "SIRET invalide"), // e.g 01234567890123
  uai: () => z.string().regex(UAI_REGEX, "UAI invalide"), // e.g 0123456B
  iso8601Date: () =>
    z
      .string()
      .regex(/^([0-9]{4})-([0-9]{2})-([0-9]{2})/, "Format invalide") // make sure the passed date contains at least YYYY-MM-DD
      .openapi({
        format: "YYYY-MM-DD",
      }),
  iso8601Datetime: () =>
    z.string().datetime("Format invalide").openapi({
      format: "YYYY-MM-DD00:00:00Z",
    }),

  codeCommuneInsee: () => z.string().regex(/^([0-9]{2}|2A|2B)[0-9]{3}$/, "Format invalide"),
};

export const primitivesV1 = {
  source: z.string().min(1), // configured by API
  apprenant: {
    nom: z.string().min(1).trim().toUpperCase().openapi({
      description: "nom de l'apprenant",
      example: "Lenôtre",
    }),
    prenom: z.string().min(1).trim().openapi({
      description: "prénom de l'apprenant",
      example: "Gaston",
    }),
    date_de_naissance: extensions.iso8601Date().openapi({
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
    id_erp: z.string().describe("Identifiant de l'apprenant dans l'ERP"),
    ine: z.string().describe("Identifiant National Élève de l'apprenant"),
    email: z.string().email("Email non valide").describe("Email de l'apprenant").openapi({
      example: "gaston.lenotre@domain.tld",
    }),
    telephone: z
      .string()
      .regex(/.*[0-9].*/, "Format invalide") // check it contains at least one digit
      .describe("Téléphone de l'apprenant")
      .openapi({
        example: "628000000",
      }),
    code_commune_insee: extensions.codeCommuneInsee().describe("Code Insee de la commune de résidence de l'apprenant"),
  },
  etablissement_responsable: {
    nom: z.string().openapi({
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
    nom: z.string().openapi({
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

  formation: {
    code_rncp: z
      .preprocess(
        // certains organismes n'envoient pas le prefix RNCP
        (v: any) => (v?.toString().toUpperCase().startsWith("RNCP") ? v : `RNCP${v}`),
        z.string().toUpperCase().regex(RNCP_REGEX, "Code RNCP invalide")
      )
      .openapi({
        description: "Code RNCP de la formation",
        examples: ["RNCP35316", "35316"],
      }),
    code_cfd: z.string().toUpperCase().regex(CFD_REGEX, "Code CFD invalide").openapi({
      description: "Code Formation Diplôme (CFD)", // aussi appelé id_formation
    }),
    libelle_court: z.string().describe("Libellé court de la formation").openapi({
      description: "Libellé court de la formation",
      example: "CAP PATISSIER",
    }),
    libelle_long: z.string().describe("Libellé complet de la formation").openapi({
      example: "CAP PATISSIER",
    }),
    // TO_DISCUSS: redondant avec année_scolaire ?
    periode: z.string().describe("Période de la formation, en année").openapi({
      example: "2022-2024",
    }),
    annee_scolaire: z
      .string()
      .regex(/^\d{4}-\d{4}$/, "Format invalide")
      .describe("Période scolaire")
      .openapi({
        examples: [`${currentYear - 1}-${currentYear}`, `${currentYear}-${currentYear}`],
      }),
    annee: z
      .preprocess((v: any) => v?.toString(), z.string())
      .describe("Année de la formation")
      // TO_DISCUSS: à quoi correspond l'année 0 ?
      .openapi({
        enum: ["0", "1", "2", "3", "4", "5"],
        example: "1",
      }),
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
    // addresse: TODO à discuter
    sexe: z.string().describe("Sexe de l'apprenant").openapi({
      enum: SEXE_APPRENANT_ENUM,
      example: "M",
    }),
    rqth: z.boolean().describe("Reconnaissance de la Qualité de Travailleur Handicapé").openapi({ example: true }),
    date_rqth: extensions
      .iso8601Date()
      .describe("Date de la reconnaissance travailleur handicapé")
      .openapi({ example: "2010-10-28T00:00:00.000Z" }),
  },
  responsable: {
    email: z
      .string()
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
    periode_exemption: z.string().openapi({
      description: "Période d'exemption de la formation",
      example: "", // TODO: A discuter
    }),
    date_exemption: extensions.iso8601Date().openapi({
      description: "Date d'exemption de la formation, au format ISO-8601",
      example: "2000-10-28T00:00:00.000Z", // TODO: A discuter
    }),
    referent_handicap: {
      nom: z.string().openapi({
        description: "Nom du référent handicap de la formation",
      }),
      prenom: z.string().openapi({
        description: "Prénom du référent handicap de la formation",
      }),
      email: z.string().email().openapi({
        description: "Email du référent handicap de la formation",
      }),
    },
    // date_declaration_1ere_absence: TODO? (a priori diversement disponible)
    // date_declaration_2e_absence: TODO? (a priori diversement disponible)
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
    code_naf: z.string().length(5, "Format invalide").describe("Code NAF de l'employeur"),
  },
};
