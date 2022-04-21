import { validateSiret } from "../domain/siret";

/**
 * Returns true if substring is found in given string. Case insensitive.
 * @param {string} str
 * @param {string} substr
 */
export const stringContains = (str, substr) => str.toLowerCase().indexOf(substr.toLowerCase()) > -1;

export const toPrettyYearLabel = (year) => (year === 1 ? `${year}ère année` : `${year}ème année`);

export const truncate = (string, size = 32) => (string.length > size ? string.substr(0, size - 1) + "..." : string);

export const pluralize = (text, value, pluralCharacter = "s") => (value > 1 ? `${text}${pluralCharacter}` : `${text}`);

export const formatNumber = (number) => {
  if (!number) return number;
  return Number(number).toLocaleString();
};

export const formatSiretSplitted = (siret) =>
  validateSiret(siret) ? `${siret.substr(0, 9)} ${siret.substr(9, siret.length)}` : "SIRET INVALIDE";

export const capitalize = (str) => {
  const firstLetter = str.charAt(0);
  return `${firstLetter.toUpperCase()}${str.substr(1)}`;
};
