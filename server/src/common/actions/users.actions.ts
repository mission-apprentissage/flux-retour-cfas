import Boom from "boom";
import { addHours } from "date-fns";
import { ObjectId } from "mongodb";
import { UsersMigration } from "../model/@types/UsersMigration.js";

import { usersMigrationDb } from "../model/collections.js";
import { AuthContext } from "../model/internal/AuthContext.js";
import { validateUser } from "../model/usersMigration.model.js";
import { generateRandomAlphanumericPhrase } from "../utils/miscUtils.js";
import { hash, compare, isTooWeak } from "../utils/passwordUtils.js";

interface UserRegistration {
  email: string;
  nom: string;
  prenom: string;
  civility: "Madame" | "Monsieur";
  fonction: string;
  telephone: string;
  password: string;
  has_accept_cgu_version: string;
}

export const createUser = async (user: UserRegistration, organisationId: ObjectId): Promise<ObjectId> => {
  const { insertedId } = await usersMigrationDb().insertOne({
    account_status: "PENDING_EMAIL_VALIDATION",
    invalided_token: false,
    password_updated_at: new Date(),
    connection_history: [],
    emails: [],
    created_at: new Date(),
    ...user,
    password: hash(user.password),
    organisation_id: organisationId,
  });

  return insertedId;
};

const updateUserPassword = async (userId: ObjectId, password: string) => {
  await usersMigrationDb().findOneAndUpdate(
    { _id: userId },
    {
      $set: {
        password: hash(password),
      },
    }
  );
};

export const authenticate = async (email: string, password: string) => {
  // FIXME projection à définir, ne pas renvoyer le password haché
  const user = await usersMigrationDb().findOne({ email });
  if (!user) {
    return null;
  }
  if (compare(password, user.password)) {
    if (isTooWeak(user.password)) {
      await updateUserPassword(user._id, password);
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
export const getUserByEmail = async (email) => {
  const user = await usersMigrationDb().findOne(
    { email },
    {
      projection: {
        emails: 0,
        connection_history: 0,
        password: 0,
      },
    }
  );
  return user;
};

/**
 * Méthode de récupération d'un utilisateur et de ses détails depuis son id
 * @param {*} _id
 * @returns
 */
export const getDetailedUserById = async (_id) => {
  const user = await usersMigrationDb()
    .aggregate([
      { $match: { _id: new ObjectId(_id) } },
      {
        $lookup: {
          from: "organismes",
          localField: "main_organisme_id",
          foreignField: "_id",
          as: "main_organisme",
        },
      },
      { $unwind: { path: "$main_organisme", preserveNullAndEmptyArrays: true } },
      // retrieve user permissions
      {
        $lookup: {
          from: "permissions",
          localField: "email",
          foreignField: "userEmail",
          as: "permissions",
          pipeline: [
            { $project: { organisme_id: 1, role: 1, pending: 1, created_at: 1 } },
            {
              $lookup: {
                from: "organismes",
                localField: "organisme_id",
                foreignField: "_id",
                as: "organisme",
                pipeline: [{ $project: { siret: 1, nom: 1, created_at: 1, uai: 1 } }],
              },
            },
            { $unwind: { path: "$organisme", preserveNullAndEmptyArrays: true } },
          ],
        },
      },
    ])
    .next();

  return user;
};

/**
 * Méthode de récupération de la liste des utilisateurs en base
 * @param {*} query
 * @returns
 */
export const getAllUsers = async (query = {}, { page, limit, sort }) => {
  const result = await usersMigrationDb()
    .aggregate([
      { $match: query },
      { $sort: sort },
      { $project: { password: 0 } },
      {
        $lookup: {
          from: "organismes",
          localField: "main_organisme_id",
          foreignField: "_id",
          as: "main_organisme",
        },
      },
      { $unwind: { path: "$main_organisme", preserveNullAndEmptyArrays: true } },
      // retrieve permissions on main organisme
      {
        $lookup: {
          from: "permissions",
          as: "permission",
          let: {
            organisme_id: "$main_organisme_id",
            user_id: "$_id",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ["organisme_id", "$$organisme_id"] }, { $eq: ["$user", "$$user_id"] }],
                },
              },
            },
            { $project: { role: 1, pending: 1, created_at: 1 } },
          ],
        },
      },
      { $unwind: { path: "$main_organisme", preserveNullAndEmptyArrays: true } },
      {
        $facet: {
          pagination: [{ $count: "total" }, { $addFields: { page, limit } }],
          data: [{ $skip: (page - 1) * limit }, { $limit: limit }],
        },
      },
      { $unwind: { path: "$pagination" } },
    ])
    .next();

  if (result?.pagination) {
    result.pagination.lastPage = Math.ceil(result.pagination.total / limit);
  }
  return result;
};

/**
 * Méthode de suppression d'un user depuis son id
 * @param {string} _idStr
 * @returns
 */
export const removeUser = async (_idStr) => {
  const _id = new ObjectId(_idStr);
  const user = await usersMigrationDb().findOne({ _id });

  if (!user) {
    throw new Error("Unable to find user");
  }

  return await usersMigrationDb().deleteOne({ _id });
};

/**
 * Méthode de mise à jour d'un user depuis son id
 * @param {*} _id
 * @returns
 */
export const updateUser = async (_id, data) => {
  const user = await usersMigrationDb().findOne({ _id: new ObjectId(_id) });

  if (!user) {
    throw new Error("Unable to find user");
  }

  const updated = await usersMigrationDb().findOneAndUpdate(
    { _id: user._id },
    {
      $set: validateUser({
        email: user.email,
        ...data,
      }),
    },
    { returnDocument: "after" }
  );

  return updated.value;
};

/**
 * Méthode de mise à jour de l'organisme principal du l'utilisateur
 * @param {*} permissionProps
 * @returns
 */
export const updateMainOrganismeUser = async ({ organisme_id, userEmail }) => {
  const user = await usersMigrationDb().findOne({ email: userEmail });

  if (!user) {
    throw new Error("Unable to find user");
  }

  const main_organisme_id = typeof organisme_id === "string" ? new ObjectId(organisme_id) : organisme_id;
  if (!ObjectId.isValid(main_organisme_id)) throw new Error("Invalid id passed");

  const updated = await usersMigrationDb().findOneAndUpdate(
    { _id: user._id },
    {
      $set: {
        main_organisme_id,
      },
    },
    { returnDocument: "after" }
  );

  return updated.value;
};

export const updateUserLastConnection = async (email) => {
  await usersMigrationDb().findOneAndUpdate(
    { email },
    {
      $set: {
        last_connection: new Date(),
      },
      // @ts-ignore
      $push: { connection_history: new Date() },
    }
  );
};

/**
 * Méthode de mise à jour du mot de passe d'un user
 */
export async function changePassword(authContext: AuthContext, password: string) {
  await usersMigrationDb().findOneAndUpdate(
    { _id: authContext._id },
    {
      $set: {
        password: hash(password),
        password_updated_at: new Date(),
      },
    }
  );
}

/**
 * Génération d'un token d'update de mot de passe
 * @param {*} email
 * @returns
 */
export const generatePasswordUpdateToken = async (email: string) => {
  const PASSWORD_UPDATE_TOKEN_VALIDITY_HOURS = 48;

  const user = await usersMigrationDb().findOne({ email });

  if (!user) {
    throw new Error("User not found");
  }

  // 1 hundred quadragintillion years to crack https://www.security.org/how-secure-is-my-password/
  const token = generateRandomAlphanumericPhrase(80);
  // token will only be valid for duration defined in PASSWORD_UPDATE_TOKEN_VALIDITY_HOURS
  const tokenExpiry = addHours(new Date(), PASSWORD_UPDATE_TOKEN_VALIDITY_HOURS);

  await usersMigrationDb().updateOne(
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

export async function updateUserProfile(ctx: AuthContext, infos: any) {
  await usersMigrationDb().findOneAndUpdate(
    { _id: ctx._id },
    {
      $set: infos,
    }
  );
}

export async function getUserById(userId: ObjectId): Promise<UsersMigration> {
  const user = await usersMigrationDb().findOne({ _id: userId });
  if (!user) {
    throw Boom.notFound(`missing user ${userId}`);
  }
  return user;
}
