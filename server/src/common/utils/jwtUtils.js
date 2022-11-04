const jwt = require("jsonwebtoken");
const config = require("../../../config");

const createToken = (type, subject, options = {}) => {
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

const createPsUserToken = (user) => {
  // Liste des champs propres à l'utilisateur à ajouter au payload du token
  const payload = {
    role: user.role,
    nom_etablissement: user.nom_etablissement || null,
    adresse_etablissement: user.adresse_etablissement || null,
    uai: user.uai || null,
    siret: user.siret || null,
    outils_gestion: user.outils_gestion || null,
  };
  const subject = user.email;
  const jwtSecret = config.auth.user.jwtSecret;
  const expiresIn = config.auth.user.expiresIn;

  return jwt.sign(payload, jwtSecret, {
    issuer: config.appName,
    expiresIn,
    subject,
  });
};

module.exports = {
  createUserToken: (user, options = {}) => {
    const payload = { permissions: user.permissions, network: user.network };
    return createToken("user", user.username, { payload, ...options });
  },
  createPsUserToken,
};
