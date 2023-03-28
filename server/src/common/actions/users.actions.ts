import { addHours } from "date-fns";
import { ObjectId } from "mongodb";

import { USER_ACCOUNT_STATUS } from "../constants/usersConstants.js";
import { UsersMigration } from "../model/@types/UsersMigration.js";
import { usersMigrationDb } from "../model/collections.js";
import { AuthContext } from "../model/internal/AuthContext.js";
import { validateUser } from "../model/usersMigration.model.js";
import { generateRandomAlphanumericPhrase } from "../utils/miscUtils.js";
import { hash as hashUtil, compare, isTooWeak } from "../utils/passwordUtils.js";
import { passwordSchema, stripEmptyFields } from "../utils/validationUtils.js";

/**
 * Méthode de création d'un utilisateur
 *
 * @param {object} requiredFields
 * @param {object} requiredFields.email - Email
 * @param {object} requiredFields.password - Password
 * @param {object} [options]
 * @param {string} [options.civility] - Civility
 * @param {string} [options.nom] - Nom
 * @param {string} [options.prenom] - Prenom
 * @param {string} [options.telephone] - Telephone
 */

interface UserRegistration {
  email: string;
  civility: "Madame" | "Monsieur";
  nom: string;
  prenom: string;
  type_organisation: string;
}

export const createUser = async (user: UserRegistration): Promise<ObjectId> => {
  const { civility, nom, prenom, email, type_organisation } = user;

  const { insertedId } = await usersMigrationDb().insertOne(
    stripEmptyFields<UsersMigration>({
      account_status: "PENDING_EMAIL_VALIDATION",
      has_accept_cgu_version: "",
      invalided_token: false,
      password_updated_at: new Date(),
      connection_history: [],
      emails: [],
      created_at: new Date(),
      email: email.toLowerCase(),
      organisation_id: undefined as any, // FIXME revoir l'inscription pour assigner l'organisation choisie
      civility,
      nom,
      prenom,
      type_organisation,
    })
  );

  return insertedId;
};

/**
 * Méthode de rehash du password de l'utilisateur
 * @param {ObjectId} _id
 * @param {*} password
 * @returns
 */
const rehashPassword = async (_id, password) => {
  const updated = await usersMigrationDb().findOneAndUpdate(
    { _id },
    {
      $set: {
        password: hashUtil(password),
      },
    },
    { returnDocument: "after" }
  );

  return updated.value;
};

/**
 * Méthode d'authentification de l'utilisateur
 * compare les hash des mots de passe
 * @param {*} email
 * @param {*} password
 * @returns
 */
export const authenticate = async (email, password) => {
  const user = await usersMigrationDb().findOne({ email });
  if (!user) {
    return null;
  }

  const current = user.password;
  if (compare(password, current)) {
    if (isTooWeak(current)) {
      await rehashPassword(user._id, password);
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
        __v: 0,
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

export const structureUser = async (user) => {
  return {
    _id: user._id,
    organisation_id: user.organisation_id,
    email: user.email,
    civility: user.civility,
    nom: user.nom,
    prenom: user.prenom,
    telephone: user.telephone,
    account_status: user.account_status,
    has_accept_cgu_version: user.has_accept_cgu_version,
  };
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

export const activateUser = async (email) => {
  return await updateUserStatus(email, USER_ACCOUNT_STATUS.PENDING_PASSWORD_SETUP);
};

export const userHasAskAccess = async (email, data) => {
  return await updateUserStatus(email, USER_ACCOUNT_STATUS.PENDING_ADMIN_VALIDATION, data);
};

export const finalizeUser = async (email: string) => {
  return await updateUserStatus(email, USER_ACCOUNT_STATUS.CONFIRMED);
};

/**
 * Méthode de mise à jour du mot de passe d'un user
 * @param {string} email
 * @param {string} newPassword
 * @returns
 */
export const changePassword = async (authContext: AuthContext, newPassword: string) => {
  const user = await usersMigrationDb().findOne({ _id: authContext._id });
  if (!user) {
    throw new Error("Unable to find user");
  }

  if (
    passwordSchema(authContext.organisation.type === "ADMINISTRATEUR")
      .required()
      .validate(newPassword).error
  ) {
    throw new Error("Password must be valid");
  }

  const updated = await usersMigrationDb().findOneAndUpdate(
    { _id: user._id },
    {
      $set: {
        account_status: getNextAccountStatus(user),
        password: hashUtil(newPassword),
        password_updated_at: new Date(),
      },
    },
    { returnDocument: "after" }
  );

  return updated.value;
};

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

/**
 * Renvoie le statut du compte après réinitialisation du mot de passe.
 * Uniquement utile lors de l'inscription.
 */
function getNextAccountStatus(user: any) {
  switch (user.account_status) {
    case "PENDING_PASSWORD_SETUP":
      return user.is_admin ? "CONFIRMED" : "PENDING_PERMISSIONS_SETUP";
    case "DIRECT_PENDING_PASSWORD_SETUP":
      return "CONFIRMED";
    default:
      return user.account_status;
  }
}

/**
 * @param {string} email
 * @param {string} newStatus
 * @param {any=} data
 */
async function updateUserStatus(email: any, newStatus: any, data?: any) {
  const user = await usersMigrationDb().findOne({ email });
  if (!user) {
    throw new Error("Unable to find user");
  }

  const updated = await usersMigrationDb().findOneAndUpdate(
    { _id: user._id },
    {
      $set: {
        account_status: newStatus,
        ...data,
      },
    },
    { returnDocument: "after" }
  );

  return updated.value;
}

export async function updateUserProfile(ctx: AuthContext, infos: any) {
  await usersMigrationDb().findOneAndUpdate(
    { _id: ctx._id },
    {
      $set: infos,
    }
  );
}
