const { ROLES } = require("../../common/roles.js");
const { PartageSimplifieUsersFactory } = require("../factory/partageSimplifieUsersFactory.js");
const { addHours, isBefore } = require("date-fns");
const { hash, compare, isTooWeak } = require("../utils/sha512Utils");
const { generateRandomAlphanumericPhrase } = require("../utils/miscUtils");

const { validatePassword } = require("../domain/password.js");
const config = require("../../../config/index.js");
const { escapeRegExp } = require("../../common/utils/regexUtils.js");
const Joi = require("joi");
const { PartageSimplifieUsersModel } = require("../model/index.js");

// TODO Merge with users component
const PASSWORD_UPDATE_TOKEN_VALIDITY_HOURS = 48;

/**
 * Méthode de création d'un utilisateur
 * génère un mot de passe par défaut
 * si aucun role n'est spécifié role OF par défaut
 * @param {*} userProps
 * @returns
 */
const createUser = async (userProps) => {
  // Champs obligatoires
  const email = userProps.email;
  const role = userProps.role || ROLES.OF;

  // Mot de passe
  const password = userProps.password || generateRandomAlphanumericPhrase(80); // 1 hundred quadragintillion years to crack https://www.security.org/how-secure-is-my-password/
  const passwordHash = hash(password);

  // Champs optionnels
  const uai = userProps.uai;
  const siret = userProps.siret;
  const nom = userProps.nom || null;
  const prenom = userProps.prenom || null;
  const fonction = userProps.fonction || null;
  const telephone = userProps.telephone || null;
  const region = userProps.region || null;
  const outils_gestion = userProps.outils_gestion || [];
  const nom_etablissement = userProps.nom_etablissement || null;
  const adresse_etablissement = userProps.adresse_etablissement || null;

  // Création via Factory
  const userEntity = PartageSimplifieUsersFactory.create({
    email,
    password: passwordHash,
    uai,
    siret,
    role,
    nom,
    prenom,
    fonction,
    telephone,
    region,
    outils_gestion,
    nom_etablissement,
    adresse_etablissement,
  });

  const saved = await new PartageSimplifieUsersModel(userEntity).save();
  const savedObject = saved.toObject();
  return savedObject._id;
};

/**
 * Méthode de génération d'un token pour update du mot de passe de l'utilisateur
 * @param {*} email
 * @returns
 */
const generatePasswordUpdateToken = async (email) => {
  if (Joi.string().email().required().validate(email).error) {
    throw new Error("Email format not valid");
  }

  const user = await PartageSimplifieUsersModel.findOne({ email });

  if (!user) {
    throw new Error("User not found");
  }

  const token = generateRandomAlphanumericPhrase(80); // 1 hundred quadragintillion years to crack https://www.security.org/how-secure-is-my-password/

  // MAJ l'utilisateur avec un token et un token_expiry
  await PartageSimplifieUsersModel.findOneAndUpdate(
    { email },
    {
      $set: {
        password_update_token: token,
        password_update_token_expiry: addHours(new Date(), PASSWORD_UPDATE_TOKEN_VALIDITY_HOURS),
        password_updated_token_at: new Date(),
      },
    }
  );

  return token;
};

/**
 * Vérifie que le token du user est valide et l'expiry valide
 * @param {*} user
 * @returns
 */
const isUserPasswordUpdatedTokenValid = (user) => {
  return Boolean(user.password_update_token_expiry) && isBefore(new Date(), user.password_update_token_expiry);
};

/**
 * Méthode de maj du password du user
 * @param {*} updateToken
 * @param {*} password
 * @returns
 */
const updatePassword = async (updateToken, password) => {
  if (!validatePassword(password)) throw new Error("Password must be valid (at least 16 characters)");

  // find user with password_update_token and ensures it exists
  const user = await PartageSimplifieUsersModel.findOne({
    password_update_token: updateToken,
    password_update_token_expiry: { $ne: null },
  });

  // throw if user is not found
  if (!user) throw new Error("User not found");

  // token must be valid
  if (!isUserPasswordUpdatedTokenValid(user)) {
    throw new Error("Password update token has expired");
  }

  // MAJ l'utilisateur avec un password et reset du token & token policy
  const updated = await PartageSimplifieUsersModel.findOneAndUpdate(
    { _id: user._id },
    {
      $set: {
        password: hash(password),
        password_updated_at: new Date(),
        password_update_token: null,
        password_update_token_expiry: null,
      },
    },
    { new: true }
  );

  return updated;
};

/**
 * Méthode de rehash du password de l'utilisateur
 * @param {*} user
 * @param {*} password
 * @returns
 */
const rehashPassword = async (userId, password) => {
  const updated = await PartageSimplifieUsersModel.findOneAndUpdate(
    { _id: userId },
    {
      $set: {
        password: hash(password),
      },
    },
    { returnDocument: "after" }
  );

  return updated;
};

/**
 * Méthode d'authentification de l'utilisateur
 * compare les hash des mots de passe
 * @param {*} email
 * @param {*} password
 * @returns
 */
const authenticate = async (email, password) => {
  const user = await PartageSimplifieUsersModel.findOne({ email });
  if (!user) {
    return null;
  }

  const current = user.password;
  if (compare(password, current)) {
    if (isTooWeak(current)) {
      await rehashPassword(user, password);
    }
    return user;
  }
  return null;
};

/**
 * Méthode de récupération d'un user depuis son email
 * @param {*} email
 * @returns
 */
const getUser = async (email) => {
  const user = await PartageSimplifieUsersModel.findOne({ email });
  if (!user) {
    throw new Error(`Unable to find user`);
  }

  return user;
};

/**
 * Méthode de récupération d'un user depuis son email
 * @param {*} email
 * @returns
 */
const getUserFromUaiSiret = async ({ uai, siret }) => {
  const user = await PartageSimplifieUsersModel.findOne({ uai, siret });
  if (!user) {
    throw new Error(`Unable to find user`);
  }

  return user;
};

/**
 * Méthode de récupération d'un user depuis son id
 * @param {*} _id
 * @returns
 */
const getUserById = async (_id) => {
  const user = await PartageSimplifieUsersModel.findOne({ _id: _id });

  if (!user) {
    throw new Error(`Unable to find user`);
  }

  return user;
};

/**
 * Méthode de récupération de la liste des utilisateurs en base
 * @returns
 */
const getAllUsers = async () => await PartageSimplifieUsersModel.find().lean();

/**
 * Méthode de récupération du lien de maj de mot de passe
 * @param {*} token
 * @returns
 */
const getTestLink = () => `${JSON.stringify(config?.publicUrl)}`;
const getUpdatePasswordLink = (token) => `${config.publicUrl}/partage-simplifie/modifier-mot-de-passe?token=${token}`;

/**
 * Méthode de recherche d'utilisateurs selon plusieurs critères
 * @param {*} searchCriteria
 * @returns
 */
const searchUsers = async (searchCriteria) => {
  const { searchTerm } = searchCriteria;

  const matchStage = {};
  if (searchTerm) {
    matchStage.$or = [
      { email: new RegExp(escapeRegExp(searchTerm), "i") },
      { nom_etablissement: new RegExp(escapeRegExp(searchTerm), "i") },
    ];
  }

  const sortStage = { nom_etablissement: 1 };

  const found = await PartageSimplifieUsersModel.aggregate([{ $match: matchStage }, { $sort: sortStage }]);

  return found;
};

module.exports = () => ({
  createUser,
  generatePasswordUpdateToken,
  updatePassword,
  authenticate,
  getUserById,
  getUser,
  getUserFromUaiSiret,
  getAllUsers,
  getUpdatePasswordLink,
  getTestLink,
  searchUsers,
});
