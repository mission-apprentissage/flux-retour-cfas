import jwt from "jsonwebtoken";
import config from "../../../config";

export const createToken = (type, subject, options = {}) => {
  const defaults = config.auth[type];
  const secret = options.secret || defaults.jwtSecret;
  const expiresIn = options.expiresIn || defaults.expiresIn;
  const payload = options.payload || {};

  return jwt.sign(payload, secret, {
    issuer: config.appName,
    expiresIn: expiresIn,
    subject: subject,
  });
};

export const createUserToken = (user, options = {}) => {
  const payload = { permissions: user.permissions, network: user.network };
  return createToken("user", user.username, { payload, ...options });
};
