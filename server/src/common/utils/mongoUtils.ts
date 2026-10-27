import { WithId } from "mongodb";

const DIACRITIQUES = [
  ["é", "e"],
  ["è", "e"],
  ["ê", "e"],
  ["ë", "e"],
  ["à", "a"],
  ["â", "a"],
  ["ä", "a"],
  ["ù", "u"],
  ["û", "u"],
  ["ü", "u"],
  ["ô", "o"],
  ["ö", "o"],
  ["î", "i"],
  ["ï", "i"],
  ["ç", "c"],
  ["ÿ", "y"],
  ["á", "a"],
  ["í", "i"],
  ["ó", "o"],
  ["ú", "u"],
  ["ñ", "n"],
  ["ã", "a"],
  ["õ", "o"],
  ["ý", "y"],
  ["ì", "i"],
  ["ò", "o"],
  ["É", "e"],
  ["È", "e"],
  ["Ê", "e"],
  ["Ë", "e"],
  ["À", "a"],
  ["Â", "a"],
  ["Ä", "a"],
  ["Ù", "u"],
  ["Û", "u"],
  ["Ü", "u"],
  ["Ô", "o"],
  ["Ö", "o"],
  ["Î", "i"],
  ["Ï", "i"],
  ["Ç", "c"],
  ["Ÿ", "y"],
  ["Á", "a"],
  ["Í", "i"],
  ["Ó", "o"],
  ["Ú", "u"],
  ["Ñ", "n"],
  ["Ã", "a"],
  ["Õ", "o"],
  ["Ý", "y"],
  ["Ì", "i"],
  ["Ò", "o"],
  ["́", ""],
  ["̀", ""],
  ["̂", ""],
  ["̈", ""],
  ["̧", ""],
  ["̃", ""],
];

const SEPARATEURS_NOM = ["-", " ", "'", "’", "‘"];

/**
 * Normalisation des accents en agrégation Mongo
 */
export function stripDiacritics(expr: Record<string, unknown>) {
  let result: Record<string, unknown> = expr;
  for (const [from, to] of DIACRITIQUES) {
    result = { $replaceAll: { input: result, find: from, replacement: to } };
  }
  return result;
}

/**
 * Clé de dédoublonnage d'un nom ou d'un prénom : sans casse, accents ni séparateurs
 */
export function dedupNomExpr(champ: string | Record<string, unknown>) {
  let result = stripDiacritics({ $toLower: { $trim: { input: { $ifNull: [champ, ""] } } } });
  for (const separateur of SEPARATEURS_NOM) {
    result = { $replaceAll: { input: result, find: separateur, replacement: "" } };
  }
  return result;
}

/**
 * Clé de dédoublonnage d'une date de naissance : jour UTC, une date stockée à partir de 22h compte pour le lendemain
 */
export function dedupDateDeNaissanceExpr(champ: string | Record<string, unknown>) {
  return {
    $cond: {
      if: { $eq: [{ $type: champ }, "date"] },
      then: { $dateTrunc: { date: { $dateAdd: { startDate: champ, unit: "hour", amount: 2 } }, unit: "day" } },
      else: null,
    },
  };
}

/**
 * Même clé que `dedupNomExpr`, calculée en JS
 */
export function dedupNom(valeur: string | null | undefined): string {
  let result = (valeur ?? "").trim().replace(/[A-Z]/g, (lettre) => lettre.toLowerCase());
  for (const [from, to] of DIACRITIQUES) {
    result = result.replaceAll(from, to);
  }
  for (const separateur of SEPARATEURS_NOM) {
    result = result.replaceAll(separateur, "");
  }
  return result;
}

/**
 * Même clé que `dedupDateDeNaissanceExpr`, calculée en JS, au format AAAA-MM-JJ
 */
export function dedupDateDeNaissance(date: Date | null | undefined): string | null {
  return date instanceof Date ? new Date(date.getTime() + 2 * 3600 * 1000).toISOString().slice(0, 10) : null;
}

/**
 * Supprime toutes les attributs à false ou 0 pour éviter une erreur mongodb
 */
export function cleanProjection<Document = object, Projection = Partial<Record<keyof WithId<Document>, unknown>>>(
  projection: Projection
): Projection {
  return Object.entries(projection as Record<string, unknown>).reduce<Record<string, unknown>>((acc, value) => {
    if (value[1] !== false && value[1] !== 0) {
      acc[value[0]] = value[1];
    }
    return acc;
  }, {}) as Projection;
}
