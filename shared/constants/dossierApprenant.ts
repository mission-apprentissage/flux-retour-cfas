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

/**
 * Liste des nom des indicateurs
 */
export const EFFECTIF_INDICATOR_NAMES = {
  apprentis: "apprenti",
  inscritsSansContrats: "inscrit sans contrat",
  rupturants: "rupturant",
  abandons: "abandon",
};

// Liste des codes de dernière situation tels que définis par SIFA
export const EFFECTIF_DERNIER_SITUATION = [
  1003, 1005, 1009, 1013, 1015, 1017, 1019, 1021, 1023, 2001, 2003, 2005, 2007, 3001, 3101, 3003, 3103, 3009, 3109,
  3011, 3111, 3031, 3131, 3032, 3132, 3033, 3133, 3117, 3119, 3021, 3121, 3023, 3123, 4001, 4101, 4003, 4103, 4005,
  4105, 4007, 4107, 4009, 4011, 4111, 4013, 4113, 4015, 4115, 4017, 4117, 4019, 4119, 4021, 4121, 4023, 4123, 4025,
  4125, 4027, 4127, 5901, 5903, 5905, 5907, 5909, 9900, 9999,
] as const;

export const SITUATION_AVANT_CONTRAT = [
  {
    label: "11 - Scolarité type collège (y. c. SEGPA, DIMA, CPA, CLIPA,MFR,...)",
    value: 11,
  },
  {
    label: "12 - Autres instituts médico-éducatifs et pédagogiques (IME, IMP)",
    value: 12,
  },
  {
    label: "21 - Second cycle général et technologique",
    value: 21,
  },
  {
    label: "31 - Second cycle professionnel (lycée professionnel, MFR, ...)",
    value: 31,
  },
  {
    label: "41 - Enseignement supérieur (y. c. CPGE)",
    value: 41,
  },
  {
    label: "51 - Contrat de professionnalisation",
    value: 51,
  },
  {
    label: "52 - Stagiaire",
    value: 52,
  },
  {
    label: "53 - En emploi",
    value: 53,
  },
  {
    label: "54 - Demandeur d’emploi, chômage",
    value: 54,
  },
  {
    label: "90 - Autre situation",
    value: 90,
  },
  {
    label: "99 - Inconnue",
    value: 99,
  },
];

export const DERNIER_DIPLOME_OBTENU = [
  {
    label: "1 - Aucun diplôme",
    value: 1,
  },
  {
    label: "2 - Certificat de formation générale (obtenu après une 3ème d’insertion ou une SEGPA)",
    value: 2,
  },
  {
    label: "3 - Brevet des collèges",
    value: 3,
  },
  {
    label: "4 - CAP / CAPA",
    value: 4,
  },
  {
    label: "5 - BEP / BEPA",
    value: 5,
  },
  {
    label: "6 - Autre diplôme de niveau 3 (ex niveau V)",
    value: 6,
  },
  {
    label: "7 - Bac général ou technologique",
    value: 7,
  },
  {
    label: "8 - Bac professionnel / Bac professionnel agricole",
    value: 8,
  },
  {
    label: "9 - Brevet professionnel / BPA / Brevet de maîtrise",
    value: 9,
  },
  {
    label: "10 - Autre diplôme de niveau 4 (niveau Bac) (ex niveau IV)",
    value: 10,
  },
  {
    label: "11 - BTS / BTSA",
    value: 11,
  },
  {
    label: "12 - DUT",
    value: 12,
  },
  {
    label: "13 - Autre diplôme de niveau 5 (bac + 2) (ex niveau III)",
    value: 13,
  },
  {
    label: "14 - Diplôme de niveaux 6, 7 et 8 (bac + 3 ou plus) (ex niveaux II ou I)",
    value: 14,
  },
  {
    label: "15 - BUT Bachelor Universitaire de Technologie",
    value: 15,
  },
  {
    label: "99 - Inconnu",
    value: 99,
  },
];
