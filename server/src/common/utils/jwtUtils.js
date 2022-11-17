import jwt from "jsonwebtoken";
import config from "../../config.js";
import { pick } from "lodash-es";

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

// les tokens actions sont par exemple notification, unsubscribe...
export function createActionToken(subject, options = {}) {
  return createToken("actionToken", subject, options);
}

export function createApiToken(user, options = {}) {
  return createToken("apiToken", user.username, {
    payload: { type: user.type, permissions: pick(user, ["is_admin"]) },
    ...options,
  });
}

export function createUserTokenSimple(options = {}) {
  return createToken("user", null, options);
}

export const createUserToken = (user, options = {}) => {
  const payload = { permissions: user.permissions, network: user.network };
  return createToken("user", user.username, { payload, ...options });
};
