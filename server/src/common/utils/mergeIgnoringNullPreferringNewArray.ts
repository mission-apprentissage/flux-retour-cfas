import { ObjectId } from "mongodb";

/**
 * Cette fonction a été créée initialement pour fusionner deux effectifs en respectant certaines règles:
 * - Si un champ est null/undefined/"" dans le nouvel effectif, on garde la valeur de l'ancien effectif
 * - Si un champ est un tableau dans le nouvel effectif, on remplace complètement le tableau de l'ancien effectif par celui du nouvel effectif
 * - Si un champ est un objet dans le nouvel effectif, on fusionne récursivement les objets (sauf dans le cas d'une Date ou ObjectId, voir ci-dessous)
 * @see mergeEffectif
 */
export function mergeIgnoringNullPreferringNewArray<GenericObject extends { [key: string]: any }>(
  previousObject: GenericObject,
  newObject: GenericObject
): GenericObject {
  let result: { [key: string]: any } = { ...previousObject };

  Object.keys(newObject).forEach((key) => {
    if (newObject[key] && Array.isArray(newObject[key])) {
      // Remplace complètement le tableau avec celui de newObject
      result[key] = newObject[key];
    } else if (newObject[key] instanceof Date || newObject[key] instanceof ObjectId) {
      // Remplace complètement la date ou l'ObjectId avec celui de newObject
      result[key] = newObject[key];
    } else if (newObject[key] && typeof newObject[key] === "object") {
      // Fusionne récursivement les objets
      result[key] = mergeIgnoringNullPreferringNewArray(result[key], newObject[key]);
    } else if (newObject[key] !== undefined && newObject[key] !== null && newObject[key] !== "") {
      // Utilise la valeur de newObject si elle n'est pas null/undefined
      result[key] = newObject[key];
    }
  });

  return result as GenericObject;
}
