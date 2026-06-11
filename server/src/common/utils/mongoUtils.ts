import { WithId } from "mongodb";

/**
 * Normalisation des accents en agrégation Mongo
 */
export function stripDiacritics(expr: Record<string, unknown>) {
  const replacements = [
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

  let result: Record<string, unknown> = expr;
  for (const [from, to] of replacements) {
    result = { $replaceAll: { input: result, find: from, replacement: to } };
  }
  return result;
}

/**
 * Supprime toutes les attributs à false ou 0 pour éviter une erreur mongodb
 */
export function cleanProjection<
  Document = object,
  Projection = Partial<Record<keyof WithId<Document>, any | boolean | 0 | 1>>,
>(projection: Projection): Projection {
  return Object.entries(projection as any).reduce((acc, value) => {
    if (value[1] !== false && value[1] !== 0) {
      acc[value[0]] = value[1];
    }
    return acc;
  }, {} as Projection);
}
