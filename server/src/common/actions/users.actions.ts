import Boom from "boom";
import { addHours } from "date-fns";
import { ObjectId, WithId } from "mongodb";

import { UsersMigration } from "@/common/model/@types/UsersMigration";
import { usersMigrationDb } from "@/common/model/collections";
import { AuthContext } from "@/common/model/internal/AuthContext";
import { getOrganisationLabel } from "@/common/model/organisations.model";
import { validateUser } from "@/common/model/usersMigration.model";
import { generateRandomAlphanumericPhrase } from "@/common/utils/miscUtils";
import { hash, compare, isTooWeak } from "@/common/utils/passwordUtils";
import { getCurrentTime } from "@/common/utils/timeUtils";

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
    password_updated_at: getCurrentTime(),
    connection_history: [],
    emails: [],
    created_at: getCurrentTime(),
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
          from: "organisations",
          localField: "organisation_id",
          foreignField: "_id",
          as: "organisation",
          pipeline: [
            {
              $lookup: {
                from: "organismes",
                as: "organisme",
                let: {
                  uai: "$uai",
                  siret: "$siret",
                },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [{ $eq: ["$siret", "$$siret"] }, { $eq: ["$uai", "$$uai"] }],
                      },
                    },
                  },
                ],
              },
            },
            { $unwind: { path: "$organisme", preserveNullAndEmptyArrays: true } },

            // lookup other email domains (used to compare user email domain with organisation domain)
            {
              $lookup: {
                from: usersMigrationDb().collectionName,
                localField: "_id",
                foreignField: "organisation_id",
                as: "domains",
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $eq: ["$account_status", "CONFIRMED"],
                      },
                    },
                  },
                  { $project: { splittedEmail: { $split: ["$email", "@"] } } },
                  { $addFields: { domain: { $last: "$splittedEmail" } } },
                  { $group: { _id: null, domains: { $addToSet: "$domain" } } },
                ],
              },
            },
          ],
        },
      },
      { $unwind: { path: "$organisation", preserveNullAndEmptyArrays: true } },

      { $project: { password: 0, emails: 0, organisation_id: 0 } },
    ])
    .next();
  if (user?.organisation?.domains?.[0]?.domains) {
    user.organisation.domains = user.organisation.domains[0].domains;
  }

  if (user?.organisation) {
    user.organisation.label = getOrganisationLabel(user.organisation);
  }

  return user;
};

/**
 * Méthode de récupération de la liste des utilisateurs en base
 * @param {*} query
 * @returns
 */
export const getAllUsers = async (
  query = {},
  { page, limit, sort } = { page: 1, limit: 10, sort: { created_at: -1 } as { [key: string]: number } }
) => {
  const result = await usersMigrationDb()
    .aggregate([
      { $match: query },
      { $sort: sort },
      { $project: { password: 0, emails: 0, connection_history: 0, invalided_token: 0 } },
      {
        $lookup: {
          from: "organisations",
          localField: "organisation_id",
          foreignField: "_id",
          as: "organisation",
          pipeline: [
            {
              $lookup: {
                from: "organismes",
                as: "organisme",
                let: {
                  uai: "$uai",
                  siret: "$siret",
                },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [{ $eq: ["$siret", "$$siret"] }, { $eq: ["$uai", "$$uai"] }],
                      },
                    },
                  },
                  { $project: { type: 1, nom: 1, raison_sociale: 1, reseaux: 1, nature: 1 } },
                ],
              },
            },
            { $unwind: { path: "$organisme", preserveNullAndEmptyArrays: true } },
          ],
        },
      },
      { $unwind: { path: "$organisation", preserveNullAndEmptyArrays: true } },
      {
        $facet: {
          pagination: [{ $count: "total" }, { $addFields: { page, limit } }],
          data: [{ $skip: (page - 1) * limit }, { $limit: limit }],
        },
      },
      { $unwind: { path: "$pagination" } },
    ])
    .next();

  result?.data?.map((user) => {
    if (user?.organisation) {
      user.organisation.label = getOrganisationLabel(user.organisation);
    }
  });

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
export const updateUser = async (_id, data: Partial<UsersMigration>) => {
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
// export const updateMainOrganismeUser = async ({ organisme_id, userEmail }) => {
//   const user = await usersMigrationDb().findOne({ email: userEmail });

//   if (!user) {
//     throw new Error("Unable to find user");
//   }

//   const main_organisme_id = typeof organisme_id === "string" ? new ObjectId(organisme_id) : organisme_id;
//   if (!ObjectId.isValid(main_organisme_id)) throw new Error("Invalid id passed");

//   const updated = await usersMigrationDb().findOneAndUpdate(
//     { _id: user._id },
//     {
//       $set: {
//         main_organisme_id,
//       },
//     },
//     { returnDocument: "after" }
//   );

//   return updated.value;
// };

export const updateUserLastConnection = async (userId: ObjectId) => {
  await usersMigrationDb().findOneAndUpdate(
    { _id: userId },
    {
      $set: {
        last_connection: getCurrentTime(),
      },
      $push: { connection_history: getCurrentTime() },
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
        password_updated_at: getCurrentTime(),
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
  const tokenExpiry = addHours(getCurrentTime(), PASSWORD_UPDATE_TOKEN_VALIDITY_HOURS);

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

export async function getUserById(userId: ObjectId): Promise<WithId<UsersMigration>> {
  const user = await usersMigrationDb().findOne({ _id: userId });
  if (!user) {
    throw Boom.notFound(`missing user ${userId}`);
  }
  return user;
}
