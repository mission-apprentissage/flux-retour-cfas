export const REPETITION_VOIE_MAPPING = { Bis: "B", Ter: "T", Quater: "Q", ["Quinquiès"]: "C" };

export const CFD_REGEX_PATTERN = "^[A-Z0-9]{8}$";
export const CODE_INSEE_PATTERN = "^[0-9]{1}[0-9A-Z]{1}[0-9]{3}$";
export const CODE_POSTAL_PATTERN = "^[0-9]{5}$";
export const RNCP_REGEX_PATTERN = "^(RNCP)?[0-9]{2,5}$";
export const SIRET_REGEX_PATTERN = "^[0-9]{14}$";
export const CODE_NAF_REGEX_PATTERN = "^[0-9]{4}[A-Z]$";
export const UAI_REGEX_PATTERN = "^[0-9]{7}[a-zA-Z]$";
export const YEAR_RANGE_PATTERN = "^[12][0-9]{3}-[12][0-9]{3}$";
export const NIR_REGEX_PATTERN = "^[0-9]{13}$";
// Le NIR peut contenir 15 caractères (13 chiffres + 2 chiffres de contrôle)
export const NIR_LOOSE_REGEX_PATTERN = "^[0-9]{13}([0-9]{2})?$";
// Source: https://github.com/colinhacks/zod/pull/2274/files#diff-52632a4861fc9d7dc2dacef13cd91d60286dd706c1bb57438b8ee6a579a8796a
// La version 3.22.2 utilise cette version pour la validation des emails, mais elle a plusieurs bugs et problèmes de performance.
// En attendant qu'une version corrigée soit publiée, on utilise la regex de cette version sans mettre à jour la librairie.
export const ZOD_3_22_2_EMAIL_REGEX_PATTERN =
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[(((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\.){3}((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\])|(\[IPv6:(([a-f0-9]{1,4}:){7}|::([a-f0-9]{1,4}:){0,6}|([a-f0-9]{1,4}:){1}:([a-f0-9]{1,4}:){0,5}|([a-f0-9]{1,4}:){2}:([a-f0-9]{1,4}:){0,4}|([a-f0-9]{1,4}:){3}:([a-f0-9]{1,4}:){0,3}|([a-f0-9]{1,4}:){4}:([a-f0-9]{1,4}:){0,2}|([a-f0-9]{1,4}:){5}:([a-f0-9]{1,4}:){0,1})([a-f0-9]{1,4}|(((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\.){3}((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2})))\])|([A-Za-z0-9]\.?([A-Za-z0-9-]+\.)*([A-Za-z0-9-])*[A-Za-z0-9]))$/;

// Numero INE (Identifiant National Elève)
// Le numero INE composé de 11 caractères,
// soit 10 chiffres et 1 lettre soit 9 chiffres et 2 lettres (depuis la rentrée 2018).
// INE BEA (Base élèves académique) 123456789FF
const INE_RNIE_REGEX_PATTERN = "^[0-9]{9}[a-zA-Z]{2}$";
// INE BEA (Base élèves académique) ex: 1234567890F
const INE_BEA_REGEX_PATTERN = "^[0-9_]{10}[a-zA-Z]{1}$";
// INE APPRENTISSAGE 1234A12345F
const INE_APPRENTISSAGE_REGEX_PATTERN = "^[0-9]{4}A[0-9]{5}[a-zA-Z]{1}$";
export const INE_REGEX_PATTERN = `^(${INE_RNIE_REGEX_PATTERN}|${INE_BEA_REGEX_PATTERN}|${INE_APPRENTISSAGE_REGEX_PATTERN})$`;

export const CFD_REGEX = new RegExp(CFD_REGEX_PATTERN);
export const CODE_POSTAL_REGEX = new RegExp(CODE_POSTAL_PATTERN);
export const INE_REGEX = new RegExp(INE_REGEX_PATTERN);
export const RNCP_REGEX = new RegExp(RNCP_REGEX_PATTERN);
export const SIRET_REGEX = new RegExp(SIRET_REGEX_PATTERN);
export const CODE_NAF_REGEX = new RegExp(CODE_NAF_REGEX_PATTERN);
export const UAI_REGEX = new RegExp(UAI_REGEX_PATTERN);
export const YEAR_RANGE_REGEX = new RegExp(YEAR_RANGE_PATTERN);
export const NIR_REGEX = new RegExp(NIR_REGEX_PATTERN);
export const NIR_LOOSE_REGEX = new RegExp(NIR_LOOSE_REGEX_PATTERN);
export const ZOD_3_22_2_EMAIL_REGEX = new RegExp(ZOD_3_22_2_EMAIL_REGEX_PATTERN);

export const isValidCFD = (cfd) => typeof cfd === "string" && CFD_REGEX.test(cfd);
export const isValidINE = (ine) => typeof ine === "string" && INE_REGEX.test(ine);
