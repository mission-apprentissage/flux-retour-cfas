import { addHours, isBefore } from "date-fns";
import { ObjectId } from "mongodb";

import { usersDb } from "@/common/model/collections";
import { generateRandomAlphanumericPhrase } from "@/common/utils/miscUtils";
import { compare, isTooWeak, hash } from "@/common/utils/passwordUtils";
import { validatePassword } from "@/common/validation/utils/password";

const PASSWORD_UPDATE_TOKEN_VALIDITY_HOURS = 48;

/**
 * Vérification de la validité du token
 */
const isUserLegacyPasswordUpdatedTokenValid = (user: any) => {
  return Boolean(user.password_update_token_expiry) && isBefore(new Date(), user.password_update_token_expiry);
};

/**
 * Authentification de l'utilisateur
 */
export const authenticateLegacy = async (username: string, password: string) => {
  const user = await usersDb().findOne({ username });
  if (!user?.password) {
    return null;
  }

  if (compare(password, user.password)) {
    const { value: updatedUser } = await usersDb().findOneAndUpdate(
      { _id: user._id },
      {
        $set: {
          last_connection: new Date(),
          ...(isTooWeak(user.password) ? { password: hash(password) } : {}),
        },
      },
      { returnDocument: "after" }
    );
    return updatedUser;
  }
  return null;
};

/**
 * Récupération d'un utilisateur depuis son username
 */
export const getUserLegacy = async (username: string) => {
  return await usersDb().findOne({ username });
};

/**
 * Création d'un utilisateur depuis props
 */
export const createUserLegacy = async (userProps: any) => {
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
    _id: new ObjectId(),
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
 */
export const generatePasswordUpdateTokenLegacy = async (username: string) => {
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
 */
export const updatePasswordLegacy = async (updateToken: any, password: any) => {
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
