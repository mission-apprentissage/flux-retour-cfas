import crypto from "crypto";

/**
 * Generates a random password with a fixed length and made of characters belonging to a specified wishlist
 * @param {*} length
 * @returns
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
 * @param {*} count
 * @param {*} total
 * @returns
 */
export const getPercentage = (count = 0, total = 0) => {
  if (total === 0) return 0;
  return Math.round((count * 100) / total);
};

/**
 * Debug helper to pretty print an object
 */
export const debug = (label, object) => {
  console.log(label, JSON.stringify(object, null, 2));
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
