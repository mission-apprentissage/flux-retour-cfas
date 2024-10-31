/**
 * Codes des statuts des apprenants
 */
export const CODES_STATUT_APPRENANT = {
  inscrit: 2,
  apprenti: 3,
  abandon: 0,
} as const;

export const CODES_STATUT_APPRENANT_ENUM = [
  CODES_STATUT_APPRENANT.abandon,
  CODES_STATUT_APPRENANT.inscrit,
  CODES_STATUT_APPRENANT.apprenti,
];

export const STATUT_APPRENANT_LABEL_MAP = {
  [CODES_STATUT_APPRENANT.abandon]: { label: "Abandon", color: "#FCEEAC" },
  [CODES_STATUT_APPRENANT.inscrit]: { label: "Sans contrat", color: "#FDDBFA" },
  [CODES_STATUT_APPRENANT.apprenti]: { label: "Apprenti", color: "#BAFAEE" },
};

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
export const EFFECTIF_DERNIER_SITUATION = [
  1003, 1005, 1009, 1013, 1015, 1017, 1019, 1021, 1023, 2001, 2003, 2005, 2007, 3001, 3101, 3003, 3103, 3009, 3109,
  3011, 3111, 3031, 3131, 3032, 3132, 3033, 3133, 3117, 3119, 3021, 3121, 3023, 3123, 4001, 4101, 4003, 4103, 4005,
  4105, 4007, 4107, 4009, 4011, 4111, 4013, 4113, 4015, 4115, 4017, 4117, 4019, 4119, 4021, 4121, 4023, 4123, 4025,
  4125, 4027, 4127, 5901, 5903, 5905, 5907, 5909, 9900, 9999,
] as const;
