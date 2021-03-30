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

export const displayYearLabelized = (year) => (year === "1" ? `${year}ère année` : `${year}ème année`);
