import { roundToOne } from "./calculUtils";

/**
 * Returns true if substring is found in given string. Case insensitive.
 * @param {string} str
 * @param {string} substr
 */
export const stringContains = (str, substr) => {
  return str.toLowerCase().indexOf(substr.toLowerCase()) > -1;
};

export const displayEvolutionPercentage = (evolutionData) =>
  evolutionData === null
    ? "N/A%"
    : evolutionData >= 0
    ? `+${roundToOne(evolutionData)}%`
    : `${roundToOne(evolutionData)}%`;

export const toPrettyYearLabel = (year) => {
  if (!year) return "N/A";
  return year === 1 ? `${year}ère année` : `${year}ème année`;
};

export const truncate = (string, size = 32) => {
  return string.length > size ? string.substr(0, size - 1) + "..." : string;
};

export const pluralize = (text, value, pluralCharacter = "s") => {
  return value > 1 ? `${text}${pluralCharacter}` : `${text}`;
};
