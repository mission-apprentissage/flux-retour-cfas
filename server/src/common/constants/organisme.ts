// FIXME plutôt utiliser un type avec des strings car const !== string
export const NATURE_ORGANISME_DE_FORMATION = {
  RESPONSABLE: "responsable" as const,
  FORMATEUR: "formateur" as const,
  RESPONSABLE_FORMATEUR: "responsable_formateur" as const,
  LIEU: "lieu_formation" as const,
  INCONNUE: "inconnue" as const,
} as const;

export const CFD_REGEX_PATTERN = "^[A-Z0-9]{8}$";
export const CODE_INSEE_PATTERN = "^[0-9]{1}[0-9A-Z]{1}[0-9]{3}$";
export const CODE_POSTAL_PATTERN = "^[0-9]{5}$";
export const INE_REGEX_PATTERN = "^[0-9]{9}[A-Z]{2}$";
export const RNCP_REGEX_PATTERN = "^(RNCP)?[0-9]{2,5}$";
export const SIRET_REGEX_PATTERN = "^[0-9]{14}$";
export const UAI_REGEX_PATTERN = "^[0-9]{7}[a-zA-Z]$";

export const CFD_REGEX = new RegExp(CFD_REGEX_PATTERN);
export const CODE_POSTAL_REGEX = new RegExp(CODE_POSTAL_PATTERN);
export const INE_REGEX = new RegExp(INE_REGEX_PATTERN);
export const RNCP_REGEX = new RegExp(RNCP_REGEX_PATTERN);
export const SIRET_REGEX = new RegExp(SIRET_REGEX_PATTERN);
export const UAI_REGEX = new RegExp(UAI_REGEX_PATTERN);
