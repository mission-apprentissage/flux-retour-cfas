import jwt from "jsonwebtoken";

import config from "@/config";

import { generateKey } from "./cryptoUtils";

interface CreateTokenOptions {
  secret?: string;
  expiresIn?: jwt.SignOptions["expiresIn"];
  payload?: object;
}

type TokenType = Exclude<keyof typeof config.auth, "passwordHashRounds">;

const createToken = (type: TokenType, subject: string | null = null, options: CreateTokenOptions = {}): string => {
  const defaults = config.auth[type];
  const secret = options.secret || defaults.jwtSecret;
  const expiresIn = (options.expiresIn || defaults.expiresIn) as jwt.SignOptions["expiresIn"];
  const payload = options.payload || {};

  const opts: jwt.SignOptions = {
    issuer: config.appName,
    expiresIn: expiresIn,
    jwtid: generateKey(5, "hex"), // = 10c, fait en sorte que chaque token généré soit unique
  };
  if (subject) {
    opts.subject = subject;
  }
  if (!secret) {
    throw new Error(`Secret JWT manquant pour le type ${type}`);
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

export function createSipaToken(username: string) {
  return createToken("sipa", username, { payload: { scope: "sipa" } });
}
