import { validateSiret } from "@/common/domain/siret";

export const formatNumber = (number) => {
  if (!number) return number;
  return Number(number).toLocaleString("fr-FR");
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

export const toPascalCase = (string) =>
  `${string}`
    .toLowerCase()
    .replace(new RegExp(/[-_]+/, "g"), " ")
    .replace(new RegExp(/[^\w\s]/, "g"), "")
    .replace(new RegExp(/\s+(.)(\w*)/, "g"), ($1, $2, $3) => `${$2.toUpperCase() + $3}`)
    .replace(new RegExp(/\w/), (s) => s.toUpperCase());
