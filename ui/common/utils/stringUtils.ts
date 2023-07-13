import { validateSiret } from "@/common/domain/siret";

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

export const formatSiretSplitted = (siret) => {
  if (!siret) return "SIRET INCONNU";
  return validateSiret(siret) ? `${siret.substr(0, 9)} ${siret.substr(9, siret.length)}` : "SIRET INVALIDE";
};

const civilityToAbbreviation = {
  Madame: "Mme",
  Monsieur: "M.",
};

export function formatCivility(civility: "Madame" | "Monsieur"): string {
  return civilityToAbbreviation[civility] ?? "";
}

export const capitalize = (str) => {
  const firstLetter = str.charAt(0);
  return `${firstLetter.toUpperCase()}${str.substr(1)}`;
};

export function normalize(string) {
  return string === null || string === undefined
    ? ""
    : string
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Retourne la représentation textuelle arrondie d'un grand nombre.
 */
export function prettyFormatNumber(number: number): string {
  if (number >= 1000) {
    const suffixes = ["", "k", "M", "B", "T"];
    const suffixNum = Math.floor(`${number.toFixed()}`.length / 3);
    const shortValue = parseFloat((suffixNum !== 0 ? number / Math.pow(1000, suffixNum) : number).toPrecision(2));
    return `${shortValue % 1 !== 0 ? shortValue.toFixed(1) : shortValue}${suffixes[suffixNum]}`;
  }
  return `${number % 1 !== 0 ? number.toFixed(1) : number}`;
}

/**
 * Escape a CSV field by replacing all " by "".
 */
export function escapeCSVField(value: string): string {
  if (typeof value === "string") {
    return value ? `"${value?.replace(/"/g, '""')}"` : "";
  } else {
    return value ? `${value}` : "";
  }
}
