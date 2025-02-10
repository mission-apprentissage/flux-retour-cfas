import { ObjectId } from "mongodb";

/**
 * Cette fonction a été créée initialement pour fusionner deux effectifs en respectant certaines règles:
 * - Si un champ est null/undefined/"" dans le nouvel effectif, on garde la valeur de l'ancien effectif
 * - Si un champ est un tableau dans le nouvel effectif, on remplace complètement le tableau de l'ancien effectif par celui du nouvel effectif
 * - Si un champ est un objet dans le nouvel effectif, on fusionne récursivement les objets (sauf dans le cas d'une Date ou ObjectId, voir ci-dessous)
 * @see mergeEffectif
 */
export function mergeIgnoringNullPreferringNewArray<GenericObject extends { [key: string]: unknown }>(
  previousObject: GenericObject | null,
  newObject: Partial<GenericObject>
): GenericObject {
  let result: { [key: string]: unknown } = { ...previousObject };

  Object.keys(newObject).forEach((key) => {
    const v = newObject[key];

    if (v === null || v === undefined || v === "") {
      // Garde la valeur de l'ancien effectif si elle est null/undefined
      return;
    }

    if (Array.isArray(v)) {
      // Remplace complètement le tableau avec celui de newObject
      result[key] = newObject[key];
      return;
    }

    if (typeof v !== "object") {
      // Utilise la valeur de newObject si elle n'est pas un objet
      result[key] = v;
      return;
    }

    if (v instanceof Date || v instanceof ObjectId) {
      // Remplace complètement la date ou l'ObjectId avec celui de newObject
      result[key] = v;
      return;
    }

    // Fusionne récursivement les objets
    result[key] = mergeIgnoringNullPreferringNewArray((result[key] ?? null) as any, v);
  });

  return result as GenericObject;
}
