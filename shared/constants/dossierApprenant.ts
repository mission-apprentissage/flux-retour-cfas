import { z } from "zod";

import { zodOpenApi } from "../models/zodOpenApi";

/**
 * Codes des statuts des apprenants
 */
export const CODES_STATUT_APPRENANT = {
  inscrit: 2,
  apprenti: 3,
  abandon: 0,
} as const;

export const zCodeStatutApprenant = zodOpenApi.union(
  [
    z.literal(CODES_STATUT_APPRENANT.abandon),
    z.literal(CODES_STATUT_APPRENANT.inscrit),
    z.literal(CODES_STATUT_APPRENANT.apprenti),
  ],
  {
    errorMap: () => ({
      message: "Valeurs possibles: 0,2,3",
    }),
  }
);

type ICodeStatutApprenant = z.output<typeof zCodeStatutApprenant>;

export const CODES_STATUT_APPRENANT_ENUM = [
  CODES_STATUT_APPRENANT.abandon,
  CODES_STATUT_APPRENANT.inscrit,
  CODES_STATUT_APPRENANT.apprenti,
] satisfies ICodeStatutApprenant[];

/**
 * Sexe des apprenants (M=Homme, F=Femme)
 */
export const SEXE_APPRENANT_ENUM = ["M", "F"] as const;

/**
 * Nom des statuts
 */
const LABELS_STATUT_APPRENANT = [
  { code: CODES_STATUT_APPRENANT.abandon, name: "abandon" },
  { code: CODES_STATUT_APPRENANT.inscrit, name: "inscrit" },
  { code: CODES_STATUT_APPRENANT.apprenti, name: "apprenti" },
];

/**
 * Fonction de récupération d'un nom de statut depuis son code
 */
export const getStatutApprenantNameFromCode = (
  statutCode?: (typeof CODES_STATUT_APPRENANT)[keyof typeof CODES_STATUT_APPRENANT]
) => LABELS_STATUT_APPRENANT.find((item) => item.code === statutCode)?.name ?? "NC";

// Liste des codes de dernière situation tels que définis par SIFA
export const zEffectifDernierSituation = zodOpenApi.union([
  z.literal(1003),
  z.literal(1005),
  z.literal(1009),
  z.literal(1017),
  z.literal(1019),
  z.literal(1021),
  z.literal(1023),
  z.literal(2001),
  z.literal(2003),
  z.literal(2005),
  z.literal(2007),
  z.literal(3001),
  z.literal(3101),
  z.literal(3003),
  z.literal(3103),
  z.literal(3009),
  z.literal(3109),
  z.literal(3011),
  z.literal(3111),
  z.literal(3031),
  z.literal(3131),
  z.literal(3032),
  z.literal(3132),
  z.literal(3033),
  z.literal(3133),
  z.literal(3117),
  z.literal(3119),
  z.literal(3021),
  z.literal(3121),
  z.literal(3023),
  z.literal(3123),
  z.literal(4001),
  z.literal(4101),
  z.literal(4003),
  z.literal(4103),
  z.literal(4005),
  z.literal(4105),
  z.literal(4007),
  z.literal(4107),
  z.literal(4009),
  z.literal(4011),
  z.literal(4111),
  z.literal(4013),
  z.literal(4113),
  z.literal(4015),
  z.literal(4115),
  z.literal(4017),
  z.literal(4117),
  z.literal(4019),
  z.literal(4119),
  z.literal(4021),
  z.literal(4121),
  z.literal(4023),
  z.literal(4123),
  z.literal(4025),
  z.literal(4125),
  z.literal(4027),
  z.literal(4127),
  z.literal(5901),
  z.literal(5903),
  z.literal(5905),
  z.literal(5907),
  z.literal(5909),
  z.literal(9900),
  z.literal(9999),
]);
