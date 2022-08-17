const crypto = require("crypto");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
module.exports.sleep = sleep;

/**
 * Generates a random password with a fixed length and made of characters belonging to a specified wishlist
 * @param {*} length
 * @param {*} wishlist
 * @returns
 */
const generateRandomAlphanumericPhrase = (length = 20) => {
  const alphanumeric = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

  return Array.from(crypto.randomFillSync(new Uint32Array(length)))
    .map((x) => alphanumeric[x % alphanumeric.length])
    .join("");
};

module.exports.generateRandomAlphanumericPhrase = generateRandomAlphanumericPhrase;
