import jwt from "jsonwebtoken";

import config from "../../config.js";

const createToken = (type, subject = null, options = {}) => {
  const defaults = config.auth[type];
  const secret = options.secret || defaults.jwtSecret;
  const expiresIn = options.expiresIn || defaults.expiresIn;
  const payload = options.payload || {};

  let opts = {
    issuer: config.appName,
    expiresIn: expiresIn,
  };
  if (subject) {
    opts.subject = subject;
  }
  return jwt.sign(payload, secret, opts);
};

export function createResetPasswordToken(username, options = {}) {
  return createToken("resetPasswordToken", username, options);
}

export function createActivationToken(subject, options = {}) {
  return createToken("activation", subject, options);
}

export function createUserTokenSimple(options = {}) {
  return createToken("user", null, options);
}

export const createUserToken = (user, options = {}) => {
  const payload = { permissions: user.permissions, network: user.network };
  return createToken("user", user.username, { payload, ...options });
};
