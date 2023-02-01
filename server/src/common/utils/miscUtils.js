import crypto from "crypto";

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Generates a random password with a fixed length and made of characters belonging to a specified wishlist
 * @param {*} length
 * @param {*} wishlist
 * @returns
 */
export const generateRandomAlphanumericPhrase = (length = 20) => {
  const alphanumeric = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

  return Array.from(crypto.randomFillSync(new Uint32Array(length)))
    .map((x) => alphanumeric[x % alphanumeric.length])
    .join("");
};

/**
 * @param  {[any]} array1
 * @param  {[any]} array2
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
export const getPercentage = (count, total) => {
  if (total === 0) return 0;
  return Math.round((count * 100) / total);
};
