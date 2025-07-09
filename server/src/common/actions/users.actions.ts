import Boom from "boom";
import { ObjectId, WithId } from "mongodb";
import { getOrganisationLabel } from "shared/models/data/organisations.model";
import { IUsersMigration } from "shared/models/data/usersMigration.model";

import { usersMigrationDb } from "@/common/model/collections";
import { AuthContext } from "@/common/model/internal/AuthContext";
import { sendEmail } from "@/common/services/mailer/mailer";
import { createActivationToken } from "@/common/utils/jwtUtils";
import { hash, compare, isTooWeak } from "@/common/utils/passwordUtils";
import { getCurrentTime } from "@/common/utils/timeUtils";
import config from "@/config";

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
  const insertedId = new ObjectId();
  await usersMigrationDb().insertOne({
    _id: insertedId,
    account_status: "PENDING_EMAIL_VALIDATION",
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
 */
export const getUserByEmail = async (email: string) => {
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
 */
export const getDetailedUserById = async (_id: string | ObjectId) => {
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
 */
export const getAllUsers = async (
  query: { [key: string]: any } = {},
  { page, limit, sort } = { page: 1, limit: 10, sort: { created_at: -1 } as { [key: string]: number } }
) => {
  const organizationFilters = query._organizationFilters || {};

  const userQuery = { ...query };
  delete userQuery._organizationFilters;

  const result = await usersMigrationDb()
    .aggregate([
      { $match: userQuery },
      {
        $project: {
          _id: 1,
          email: 1,
          nom: 1,
          prenom: 1,
          civility: 1,
          fonction: 1,
          telephone: 1,
          account_status: 1,
          organisation_id: 1,
          created_at: 1,
          has_accept_cgu_version: 1,
        },
      },
      {
        $lookup: {
          from: "organisations",
          localField: "organisation_id",
          foreignField: "_id",
          as: "organisation",
          pipeline: [
            {
              $project: {
                _id: 1,
                type: 1,
                nom: 1,
                uai: 1,
                siret: 1,
                code_departement: 1,
                code_region: 1,
                code_academie: 1,
                adresse: 1,
              },
            },
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
                  {
                    $project: {
                      type: 1,
                      nom: 1,
                      raison_sociale: 1,
                      reseaux: 1,
                      nature: 1,
                      "adresse.departement": 1,
                      "adresse.region": 1,
                    },
                  },
                ],
              },
            },
            { $unwind: { path: "$organisme", preserveNullAndEmptyArrays: true } },
          ],
        },
      },
      { $unwind: { path: "$organisation", preserveNullAndEmptyArrays: true } },
      ...(Object.keys(organizationFilters).length > 0
        ? [
            {
              $match: organizationFilters,
            },
          ]
        : []),
      { $sort: sort },
      {
        $facet: {
          pagination: [{ $count: "total" }, { $addFields: { page, limit } }],
          data: [{ $skip: (page - 1) * limit }, { $limit: limit }],
        },
      },
      { $unwind: { path: "$pagination" } },
    ])
    .next();

  result?.data?.forEach((user) => {
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
 */
export const updateUser = async (_id: string | ObjectId, data: Partial<IUsersMigration>) => {
  const user = await usersMigrationDb().findOne({ _id: new ObjectId(_id) });

  if (!user) {
    throw new Error("Unable to find user");
  }

  if (data.email && data.email !== user.email) {
    const existingUser = await getUserByEmail(data.email);
    if (existingUser && existingUser._id.toString() !== user._id.toString()) {
      throw Boom.conflict("Cet email est déjà utilisé.");
    }
  }

  const updated = await usersMigrationDb().findOneAndUpdate(
    { _id: user._id },
    {
      $set: {
        email: user.email,
        ...data,
      },
    },
    { returnDocument: "after" }
  );

  return updated.value;
};

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

export async function updateUserProfile(ctx: AuthContext, infos: Partial<IUsersMigration>) {
  await usersMigrationDb().findOneAndUpdate(
    { _id: ctx._id },
    {
      $set: infos,
    }
  );
}

export async function getUserById(userId: ObjectId): Promise<WithId<IUsersMigration>> {
  const user = await usersMigrationDb().findOne({ _id: userId });
  if (!user) {
    throw Boom.notFound(`missing user ${userId}`);
  }
  return user;
}

export async function resendConfirmationEmail(userId: string): Promise<void> {
  const user = await getUserById(new ObjectId(userId));
  await sendEmail(user.email, "activation_user", {
    recipient: {
      civility: user.civility,
      nom: user.nom,
      prenom: user.prenom,
    },
    tdbEmail: config.email,
    activationToken: createActivationToken(user.email),
  });
}
