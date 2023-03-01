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
  // @ts-ignore
  return round < config.auth.passwordHashRounds;
}
