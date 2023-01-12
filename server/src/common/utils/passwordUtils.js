import crypto from "crypto";
import { sha512crypt } from "sha512crypt-node";
import config from "../../config.js";

export function hash(password, rounds = config.auth.passwordHashRounds) {
  const salt = crypto.randomBytes(16).toString("hex");
  return sha512crypt(password, `$6$rounds=${rounds}$${salt}`);
}

export function compare(password, hash) {
  const array = hash.split("$");
  array.pop();

  return sha512crypt(password, array.join("$")) === hash;
}

export function isTooWeak(hash) {
  const array = hash.split("$");
  const round = array[2].split("=")[1];
  return round < config.auth.passwordHashRounds;
}

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
