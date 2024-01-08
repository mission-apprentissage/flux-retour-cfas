import crypto from "crypto";

/**
 * Generates a random password with a fixed length and made of characters belonging to a specified wishlist
 */
export const generateRandomAlphanumericPhrase = (length = 20) => {
  const alphanumeric = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

  return Array.from(crypto.randomFillSync(new Uint32Array(length)))
    .map((x) => alphanumeric[x % alphanumeric.length])
    .join("");
};

/**
 * @param  {any[]} array1
 * @param  {any[]} array2
 * @returns  {boolean}
 */
export const arraysContainSameValues = (array1, array2) => {
  if (!Array.isArray(array1) || !Array.isArray(array2) || array1.length !== array2.length) {
    return false;
  }

  array1.forEach((item) => {
    if (!array2.includes(item)) return false;
  });
  return true;
};

/**
 * Méthode de calcul de pourcentage
 */
export const getPercentage = (count = 0, total = 0) => {
  if (total === 0) return 0;
  return Math.round((count * 100) / total);
};

/**
 * Creates an object composed of the own and inherited enumerable property paths
 * of *object* that are not omitted.
 */
export const omit = (object, props) => {
  const copy = { ...object };
  props.forEach((prop) => delete copy[prop]);
  return copy;
};

export function stripEmptyFields<T extends object>(object: T): T {
  return Object.entries(object).reduce((acc, [key, value]) => {
    if (typeof value !== "undefined" && value !== null && value !== "") {
      acc[key] = value?.constructor?.name === "Object" ? stripEmptyFields(value) : value;
    }
    return acc;
  }, {}) as T;
}

/**
 * Renvoie une copie de l'objet en paramètre dont les propriétés ont été préfixées.
 * @param prefix
 * @param obj
 * @returns
 */
export function addPrefixToProperties<
  Prefix extends string,
  Obj extends Record<string, any>,
  PrefixedObj = AddPrefix<Prefix, Obj>,
>(prefix: Prefix, obj: Obj): PrefixedObj {
  const newObj = {} as PrefixedObj;

  for (const key in obj) {
    // @ts-expect-error
    newObj[`${prefix}${key}`] = obj[key];
  }

  return newObj;
}

export type AddPrefix<Prefix extends string, T> = {
  [K in keyof T as `${Prefix}${string & K}`]: T[K];
};
