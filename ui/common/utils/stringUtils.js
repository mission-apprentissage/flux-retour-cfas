import { validateSiret } from "../domain/siret";

/**
 * Returns true if substring is found in given string. Case insensitive.
 * @param {string} str
 * @param {string} substr
 */
export const stringContains = (str, substr) => str.toLowerCase().indexOf(substr.toLowerCase()) > -1;

/**
 * Returns true if both strings are equal. Case insensitive.
 * @param {string} str
 * @param {string} substr
 */
export const stringEqualsCaseInsensitive = (str1 = "", str2 = "") => {
  return str1.toLowerCase() === str2.toLowerCase();
};

export const toPrettyYearLabel = (year) => (year === 1 ? `${year}ère année` : `${year}ème année`);

export const pluralize = (text, value, pluralCharacter = "s") => (value > 1 ? `${text}${pluralCharacter}` : `${text}`);

export const formatNumber = (number) => {
  if (!number) return number;
  return Number(number).toLocaleString();
};

export const capitalize = (str) => {
  const firstLetter = str.charAt(0);
  return `${firstLetter.toUpperCase()}${str.substr(1)}`;
};
