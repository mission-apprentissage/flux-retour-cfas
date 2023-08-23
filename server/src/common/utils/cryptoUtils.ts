import crypto from "crypto";

import checksumStream from "checksum-stream";

import config from "@/config";

const KEY = config.ovhStorage.encryptionKey;

export function isCipherAvailable() {
  return !!KEY;
}

export function cipher(iv: string) {
  if (!KEY || !iv) {
    throw new Error("Impossible chiffrer la donnée");
  }

  //See https://crypto.stackexchange.com/a/3970/60417 for more informations about vector
  return crypto.createCipheriv("aes-256-cbc", KEY, iv.slice(0, 16));
}

export function decipher(iv: string) {
  return crypto.createDecipheriv("aes-256-cbc", KEY, iv.slice(0, 16));
}

export function checksum() {
  let stream = checksumStream({
    algorithm: "md5",
  });

  let promise = new Promise<string>((resolve, reject) => {
    stream.on("digest", resolve);
    stream.on("error", reject);
  });

  return {
    hashStream: stream,
    getHash: () => promise,
  };
}

export function generateKey(size = 32, format = "base64") {
  const buffer = crypto.randomBytes(size);
  // @ts-expect-error
  return buffer.toString(format);
}

export function generateSecretHash(key) {
  const salt = crypto.randomBytes(8).toString("hex");
  const buffer = crypto.scryptSync(key, salt, 64);
  return `${buffer.toString("hex")}.${salt}`;
}

export function compareKeys(storedKey, suppliedKey) {
  const [hashedPassword, salt] = storedKey.split(".");

  const buffer = crypto.scryptSync(suppliedKey, salt, 64);
  return crypto.timingSafeEqual(Buffer.from(hashedPassword, "hex"), buffer);
}

// USAGE
// const key = generateKey(); // send to user: Jj0fmQUis7xKJ6oge4r1fN4em7xJ+hILrgubKlG6PLA=
// const secretHash = generateSecretHash(key); // save in db: c10c7e79fc496144ee245d9dcbe52d9d3910c2a514af1cfe8afda9ea655815efed5bd2a793b31bf923fe47d212bab7896cd527c720849678077e34cdd6fec0a2.2f717b397644fdcc
// VERIF => compareKeys(secretHash, key)
