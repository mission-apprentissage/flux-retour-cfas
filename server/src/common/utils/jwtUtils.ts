import jwt from "jsonwebtoken";

import config from "@/config";

import { generateKey } from "./cryptoUtils";

const createToken = (type: string, subject: string | null = null, options: any = {}): string => {
  const defaults = config.auth[type];
  const secret = options.secret || defaults.jwtSecret;
  const expiresIn = options.expiresIn || defaults.expiresIn;
  const payload = options.payload || {};

  let opts: any = {
    issuer: config.appName,
    expiresIn: expiresIn,
    jwtid: generateKey(5, "hex"), // = 10c, fait en sorte que chaque token généré soit unique
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

export const createUserToken = (user, options: any = {}) => {
  const payload = {
    is_admin: user.is_admin,
    is_cross_organismes: user.is_cross_organismes,
    network: user.network,
  };
  return createToken("user", user.username, { payload, ...options });
};
