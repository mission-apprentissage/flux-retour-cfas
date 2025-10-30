import Boom from "boom";
import { ObjectId, WithId } from "mongodb";
import { getOrganisationLabel } from "shared/models/data/organisations.model";
import { IUsersMigration } from "shared/models/data/usersMigration.model";

import { organisationsDb, usersMigrationDb } from "@/common/model/collections";
import { AuthContext } from "@/common/model/internal/AuthContext";
import { sendEmail } from "@/common/services/mailer/mailer";
import { createActivationToken } from "@/common/utils/jwtUtils";
import { hash, compare, isTooWeak } from "@/common/utils/passwordUtils";
import { getCurrentTime } from "@/common/utils/timeUtils";
import { escapeRegex } from "@/common/utils/usersFiltersUtils";
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

async function findMatchingOrganisationIds(searchTerm: string): Promise<ObjectId[]> {
  const escapedTerm = escapeRegex(searchTerm.trim());

  const matchingOrganisations = await organisationsDb()
    .aggregate([
      {
        $lookup: {
          from: "organismes",
          let: { siret: "$siret", uai: "$uai" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ["$siret", "$$siret"] }, { $eq: ["$uai", "$$uai"] }],
                },
              },
            },
          ],
          as: "organisme",
        },
      },
      { $unwind: { path: "$organisme", preserveNullAndEmptyArrays: true } },
      {
        $match: {
          $or: [
            { nom: { $regex: escapedTerm, $options: "i" } },
            { siret: { $regex: escapedTerm, $options: "i" } },
            { uai: { $regex: escapedTerm, $options: "i" } },
            { "organisme.nom": { $regex: escapedTerm, $options: "i" } },
            { "organisme.raison_sociale": { $regex: escapedTerm, $options: "i" } },
            { "organisme.enseigne": { $regex: escapedTerm, $options: "i" } },
            { "organisme.siret": { $regex: escapedTerm, $options: "i" } },
            { "organisme.uai": { $regex: escapedTerm, $options: "i" } },
          ],
        },
      },
      { $project: { _id: 1 } },
    ])
    .toArray();

  return matchingOrganisations.map((o) => o._id);
}

function buildUsersAggregationPipeline(
  userQuery: { [key: string]: any },
  organizationFilters: { [key: string]: any },
  sort: { [key: string]: number },
  searchMode: "user" | "org" | "email-exact" | "phone" | "email-domain" | "standard" = "standard"
) {
  const pipeline: any[] = [];

  const hasTextSearch = userQuery._hasTextSearch;
  const searchTerm = userQuery._searchTerm;

  const cleanQuery = { ...userQuery };
  delete cleanQuery._hasTextSearch;
  delete cleanQuery._searchTerm;
  delete cleanQuery._preFilteredOrgIds;

  if (searchMode === "email-exact" && hasTextSearch && searchTerm) {
    const trimmedTerm = searchTerm.trim().toLowerCase();
    cleanQuery.email = { $regex: `^${escapeRegex(trimmedTerm)}$`, $options: "i" };
  } else if (searchMode === "email-domain" && hasTextSearch && searchTerm) {
    const domain = searchTerm.trim();
    const escapedDomain = escapeRegex(domain);
    cleanQuery.email = { $regex: `^[^@]+${escapedDomain}`, $options: "i" };
  } else if (searchMode === "phone" && hasTextSearch && searchTerm) {
    const normalizedPhone = searchTerm.replace(/[\s.\-+()]/g, "");
    const escapedPhone = escapeRegex(normalizedPhone);
    cleanQuery.telephone = { $regex: escapedPhone, $options: "i" };
  } else if (searchMode === "user" && hasTextSearch && searchTerm) {
    const trimmedTerm = searchTerm.trim();
    if (trimmedTerm.length >= 2 && trimmedTerm.length <= 100) {
      pipeline.push({ $match: { $text: { $search: trimmedTerm } } });
    }
  }

  if (Object.keys(cleanQuery).length > 0) {
    pipeline.push({ $match: cleanQuery });
  }

  pipeline.push(
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
        password_updated_at: 1,
        last_connection: 1,
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
                    enseigne: 1,
                    reseaux: 1,
                    nature: 1,
                    siret: 1,
                    uai: 1,
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
    {
      $addFields: {
        nomComplet: { $concat: ["$prenom", " ", "$nom"] },
        nomCompletInverse: { $concat: ["$nom", " ", "$prenom"] },
      },
    }
  );

  const postLookupFilters: any[] = [];

  if (hasTextSearch && searchTerm && searchMode === "standard") {
    const trimmedTerm = searchTerm.trim();

    if (trimmedTerm.length >= 2 && trimmedTerm.length <= 100) {
      const escapedTerm = escapeRegex(trimmedTerm);

      const searchConditions: any[] = [
        { nom: { $regex: escapedTerm, $options: "i" } },
        { prenom: { $regex: escapedTerm, $options: "i" } },
        { nomComplet: { $regex: escapedTerm, $options: "i" } },
        { nomCompletInverse: { $regex: escapedTerm, $options: "i" } },
        { email: { $regex: escapedTerm, $options: "i" } },
        { telephone: { $regex: escapedTerm, $options: "i" } },
        { "organisation.nom": { $regex: escapedTerm, $options: "i" } },
        { "organisation.siret": { $regex: escapedTerm, $options: "i" } },
        { "organisation.uai": { $regex: escapedTerm, $options: "i" } },
        { "organisation.organisme.nom": { $regex: escapedTerm, $options: "i" } },
        { "organisation.organisme.raison_sociale": { $regex: escapedTerm, $options: "i" } },
        { "organisation.organisme.enseigne": { $regex: escapedTerm, $options: "i" } },
        { "organisation.organisme.siret": { $regex: escapedTerm, $options: "i" } },
        { "organisation.organisme.uai": { $regex: escapedTerm, $options: "i" } },
      ];

      postLookupFilters.push({ $or: searchConditions });
    }
  }

  if (Object.keys(organizationFilters).length > 0) {
    postLookupFilters.push(organizationFilters);
  }

  if (postLookupFilters.length > 0) {
    if (postLookupFilters.length === 1) {
      pipeline.push({ $match: postLookupFilters[0] });
    } else {
      pipeline.push({ $match: { $and: postLookupFilters } });
    }
  }

  pipeline.push({ $sort: sort });

  return pipeline;
}

export const getAllUsers = async (
  query: { [key: string]: any } = {},
  {
    page = 1,
    limit = 10,
    sort = { created_at: -1 } as { [key: string]: number },
    forExport = false,
  }: {
    page?: number;
    limit?: number;
    sort?: { [key: string]: number };
    forExport?: boolean;
  } = {}
) => {
  const MAX_EXPORT_LIMIT = 10000;
  const organizationFilters = query._organizationFilters || {};

  const userQuery = { ...query };
  delete userQuery._organizationFilters;

  let searchMode: "user" | "org" | "email-exact" | "phone" | "email-domain" | "standard" = "standard";
  const hasTextSearch = userQuery._hasTextSearch;
  const searchTerm = userQuery._searchTerm;

  if (hasTextSearch && searchTerm) {
    const { analyzeSearchTerm } = await import("@/common/utils/usersFiltersUtils");
    const searchType = analyzeSearchTerm(searchTerm);

    if (searchType === "email-exact") {
      searchMode = "email-exact";
    } else if (searchType === "email-domain") {
      searchMode = "email-domain";
    } else if (searchType === "phone") {
      searchMode = "phone";
    } else if (searchType === "user") {
      searchMode = "user";
    } else if (searchType === "org") {
      const matchingOrgIds = await findMatchingOrganisationIds(searchTerm);

      if (matchingOrgIds.length === 0) {
        return forExport
          ? []
          : {
              users: [],
              pagination: { total: 0, page, limit, lastPage: 0 },
              globalTotal: await usersMigrationDb().estimatedDocumentCount(),
            };
      }

      userQuery.organisation_id = { $in: matchingOrgIds };
      searchMode = "org";
      delete userQuery._hasTextSearch;
      delete userQuery._searchTerm;
    }
  }

  const pipeline = buildUsersAggregationPipeline(userQuery, organizationFilters, sort, searchMode);

  if (forExport) {
    const users = await usersMigrationDb()
      .aggregate([...pipeline, { $limit: MAX_EXPORT_LIMIT }])
      .toArray();

    users?.forEach((user) => {
      if (user?.organisation) {
        user.organisation.label = getOrganisationLabel(user.organisation);
      }
    });

    return users;
  }

  const globalTotalResult = await usersMigrationDb().estimatedDocumentCount();

  const result = await usersMigrationDb()
    .aggregate([
      ...pipeline,
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
    result.pagination.globalTotal = globalTotalResult;
  }

  return result;
};

export const getAllUsersForExport = async (
  query: { [key: string]: any } = {},
  { sort = { created_at: -1 } }: { sort?: { [key: string]: number } } = {}
) => {
  return getAllUsers(query, { sort, forExport: true });
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
