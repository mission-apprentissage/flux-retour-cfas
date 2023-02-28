import { ObjectId } from "mongodb";
import { addHours, isBefore } from "date-fns";
import { usersDb } from "../../model/collections.js";
import { generateRandomAlphanumericPhrase } from "../../utils/miscUtils.js";
import { compare, isTooWeak, hash } from "../../utils/sha512Utils.js";
import { validatePassword } from "../../utils/validationsUtils/password.js";
import { escapeRegExp } from "../../utils/regexUtils.js";

const PASSWORD_UPDATE_TOKEN_VALIDITY_HOURS = 48;

/**
 * Vérification de la validité du token
 * @param {*} user
 * @returns
 */
export const isUserLegacyPasswordUpdatedTokenValid = (user) => {
  return Boolean(user.password_update_token_expiry) && isBefore(new Date(), user.password_update_token_expiry);
};

/**
 * Authentification de l'utilisateur
 * @param {*} username
 * @param {*} password
 * @returns
 */
export const authenticateLegacy = async (username, password) => {
  const user = await usersDb().findOne({ username });
  if (!user) {
    return null;
  }

  const current = user.password;
  if (compare(password, current)) {
    if (isTooWeak(current)) {
      await usersDb().updateOne({ _id: user._id }, { password: hash(password) });
    }
    return user;
  }
  return null;
};

/**
 * Récupération d'un utilisateur depuis son username
 * @param {*} username
 * @returns
 */
export const getUserLegacy = async (username) => {
  return await usersDb().findOne({ username });
};

/**
 * Récupération d'un utilisateur depuis son id
 * @param {*} id
 * @returns
 */
export const getUserLegacyById = async (id) => {
  const _id = new ObjectId(id);
  if (!ObjectId.isValid(_id)) throw new Error("Invalid id passed");
  const user = await usersDb().findOne({ _id });
  if (!user) {
    throw new Error("Unable to find user");
  }
  return user;
};

/**
 * Création d'un utilisateur depuis props
 * @param {*} userProps
 * @returns
 */
export const createUserLegacy = async (userProps) => {
  const username = userProps.username;
  const password = userProps.password || generateRandomAlphanumericPhrase(80); // 1 hundred quadragintillion years to crack https://www.security.org/how-secure-is-my-password/
  const passwordHash = hash(password);
  const permissions = userProps.permissions || [];
  const network = userProps.network || null;
  const region = userProps.region || null;
  const organisme = userProps.organisme || null;
  const email = userProps.email || null;

  // check if username is not taken
  const user = await usersDb().findOne({ username });
  if (user) throw new Error("User with this username already exists");

  const { insertedId } = await usersDb().insertOne({
    username,
    password: passwordHash,
    email,
    permissions,
    network,
    region,
    organisme,
    created_at: new Date(),
  });

  return insertedId;
};

/**
 * Génération d'un token d'update de mot de passe
 * @param {*} username
 * @returns
 */
export const generatePasswordUpdateTokenLegacy = async (username) => {
  const user = await usersDb().findOne({ username });

  if (!user) {
    throw new Error("User not found");
  }

  // 1 hundred quadragintillion years to crack https://www.security.org/how-secure-is-my-password/
  const token = generateRandomAlphanumericPhrase(80);
  // token will only be valid for duration defined in PASSWORD_UPDATE_TOKEN_VALIDITY_HOURS
  const tokenExpiry = addHours(new Date(), PASSWORD_UPDATE_TOKEN_VALIDITY_HOURS);

  await usersDb().updateOne(
    { _id: user._id },
    {
      $set: {
        password_update_token: token,
        password_update_token_expiry: tokenExpiry,
      },
    }
  );

  return token;
};

/**
 * Mise à jour du mot de passe
 * @param {*} updateToken
 * @param {*} password
 * @returns
 */
export const updatePasswordLegacy = async (updateToken, password) => {
  if (!validatePassword(password)) throw new Error("Password must be valid (at least 16 characters)");
  // find user with password_update_token and ensures it exists
  const user = await usersDb().findOne({
    password_update_token: updateToken,
    password_update_token_expiry: { $ne: null },
  });
  // throw if user is not found
  if (!user) throw new Error("User not found");
  // token must be valid
  if (!isUserLegacyPasswordUpdatedTokenValid(user)) {
    throw new Error("Password update token has expired");
  }
  // we store password hashes only
  const passwordHash = hash(password);

  await usersDb().updateOne(
    { _id: user._id },
    {
      $set: {
        password: passwordHash,
        password_update_token: null,
        password_update_token_expiry: null,
      },
    }
  );

  // TODO return nothing (single responsibility)
  return user.username;
};

/**
 * Suppression d'un utilisateur
 * @param {*} username
 */
export const removeUserLegacy = async (username) => {
  const user = await usersDb().findOne({ username });
  if (!user) {
    throw new Error(`Unable to find user ${username}`);
  }

  await usersDb().deleteOne({ username });
};

/**
 * Recherche parmi les utilisateurs depuis un critère de recherche
 * @param {*} searchCriteria
 * @returns
 */
export const searchUsersLegacy = async (searchCriteria) => {
  const { searchTerm } = searchCriteria;

  const matchStage = {};
  if (searchTerm) {
    matchStage.$or = [
      { username: new RegExp(escapeRegExp(searchTerm), "i") },
      { email: new RegExp(escapeRegExp(searchTerm), "i") },
      { organisme: new RegExp(escapeRegExp(searchTerm), "i") },
      { region: new RegExp(escapeRegExp(searchTerm), "i") },
    ];
  }

  const sortStage = { username: 1 };

  const found = await usersDb()
    .aggregate([{ $match: matchStage }, { $sort: sortStage }])
    .toArray();

  return found.map((user) => {
    return {
      id: user._id,
      username: user.username,
      email: user.email,
      permissions: user.permissions,
      network: user.network,
      region: user.region,
      organisme: user.organisme,
      created_at: user.created_at,
    };
  });
};

/**
 * Mise à jour d'un utilisateur
 * @param {*} id
 * @param {*} param1
 */
export const updateUserLegacy = async (id, { username, email, network, region, organisme }) => {
  const _id = new ObjectId(id);
  if (!ObjectId.isValid(_id)) throw new Error("Invalid id passed");

  const user = await usersDb().findOne({ _id });

  if (!user) {
    throw new Error("Unable to find user");
  }

  await usersDb().updateOne(
    { _id },
    {
      $set: {
        username,
        email,
        network,
        region,
        organisme,
      },
    }
  );
};
