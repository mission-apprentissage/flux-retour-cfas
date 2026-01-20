import jwt from "jsonwebtoken";

import config from "@/config";

import { generateHexKey } from "./cryptoUtils";

const createToken = (type: string, subject: string | null = null, options: any = {}): string => {
  const defaults = config.auth[type];
  const secret = options.secret || defaults.jwtSecret;
  const expiresIn = options.expiresIn || defaults.expiresIn;
  const payload = options.payload || {};

  let opts: any = {
    issuer: config.appName,
    expiresIn: expiresIn,
    jwtid: generateHexKey(5), // = 10c, fait en sorte que chaque token généré soit unique
  };
  if (subject) {
    opts.subject = subject;
  }
  return jwt.sign(payload, secret, opts);
};

export function createResetPasswordToken(email: string) {
  return createToken("resetPasswordToken", email);
}

export function createActivationToken(email: string) {
  return createToken("activation", email);
}

export function createUserTokenSimple(options = {}) {
  return createToken("user", null, options);
}
