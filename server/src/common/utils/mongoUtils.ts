import { WithId } from "mongodb";

import { DECALAGE_DATE_METIER_MS } from "./dateUtils";

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

const LETTRES_SPECIALES = [
  ["æ", "ae"],
  ["Æ", "ae"],
  ["œ", "oe"],
  ["Œ", "oe"],
  ["ß", "ss"],
  ["ø", "o"],
  ["Ø", "o"],
  ["å", "a"],
  ["Å", "a"],
  ["ł", "l"],
  ["Ł", "l"],
  ["ą", "a"],
  ["Ą", "a"],
  ["ę", "e"],
  ["Ę", "e"],
  ["ć", "c"],
  ["Ć", "c"],
  ["ń", "n"],
  ["Ń", "n"],
  ["ś", "s"],
  ["Ś", "s"],
  ["ź", "z"],
  ["Ź", "z"],
  ["ż", "z"],
  ["Ż", "z"],
  ["ş", "s"],
  ["Ş", "s"],
  ["ș", "s"],
  ["Ș", "s"],
  ["ţ", "t"],
  ["Ţ", "t"],
  ["ț", "t"],
  ["Ț", "t"],
  ["ğ", "g"],
  ["Ğ", "g"],
  ["ı", "i"],
  ["İ", "i"],
  ["ă", "a"],
  ["Ă", "a"],
  ["č", "c"],
  ["Č", "c"],
  ["š", "s"],
  ["Š", "s"],
  ["ž", "z"],
  ["Ž", "z"],
  ["ř", "r"],
  ["Ř", "r"],
  ["ě", "e"],
  ["Ě", "e"],
  ["ů", "u"],
  ["Ů", "u"],
  ["̆", ""],
  ["̌", ""],
  ["̨", ""],
  ["̇", ""],
  ["̊", ""],
];

const SEPARATEURS_NOM = ["-", " ", "'", "’", "‘"];

const REMPLACEMENTS_NOM = [...LETTRES_SPECIALES, ...SEPARATEURS_NOM.map((separateur) => [separateur, ""])];

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

export function dedupNomExpr(champ: string | Record<string, unknown>) {
  return {
    $reduce: {
      input: { $literal: [...DIACRITIQUES, ...REMPLACEMENTS_NOM] },
      initialValue: { $toLower: { $trim: { input: { $ifNull: [champ, ""] } } } },
      in: {
        $replaceAll: {
          input: "$$value",
          find: { $arrayElemAt: ["$$this", 0] },
          replacement: { $arrayElemAt: ["$$this", 1] },
        },
      },
    },
  };
}

export function dateMetierExpr(champ: string | Record<string, unknown>) {
  return {
    $cond: {
      if: { $eq: [{ $type: champ }, "date"] },
      then: {
        $dateTrunc: {
          date: { $dateAdd: { startDate: champ, unit: "millisecond", amount: DECALAGE_DATE_METIER_MS } },
          unit: "day",
        },
      },
      else: null,
    },
  };
}

export function dedupNom(valeur: string | null | undefined): string {
  let result = (valeur ?? "").trim().replace(/[A-Z]/g, (lettre) => lettre.toLowerCase());
  for (const [from, to] of [...DIACRITIQUES, ...REMPLACEMENTS_NOM]) {
    result = result.replaceAll(from, to);
  }
  return result;
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
