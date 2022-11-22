import crypto from "crypto";
import checksumStream from "checksum-stream";
import config from "../../config.js";

const KEY = config.ovhStorage.encryptionKey;

export function isCipherAvailable() {
  return !!KEY;
}

export function cipher(iv) {
  if (!KEY || !iv) {
    throw new Error("Impossible chiffrer la donnée");
  }

  //See https://crypto.stackexchange.com/a/3970/60417 for more informations about vector
  return crypto.createCipheriv("aes-256-cbc", KEY, iv.slice(0, 16));
}

export function decipher(iv) {
  return crypto.createDecipheriv("aes-256-cbc", KEY, iv.slice(0, 16));
}

export function checksum() {
  let stream = checksumStream({
    algorithm: "md5",
  });

  let promise = new Promise((resolve, reject) => {
    stream.on("digest", resolve);
    stream.on("error", reject);
  });

  return {
    hashStream: stream,
    getHash: () => promise,
  };
}
