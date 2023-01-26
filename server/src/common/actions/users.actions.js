import { addHours } from "date-fns";
import { compact, pick, uniq } from "lodash-es";
import { ObjectId } from "mongodb";
import { rolesDb, usersMigrationDb } from "../model/collections.js";
import { defaultValuesUser, validateUser } from "../model/next.toKeep.models/usersMigration.model.js";
import { generateRandomAlphanumericPhrase } from "../utils/miscUtils.js";
import { hash as hashUtil, compare, isTooWeak } from "../utils/passwordUtils.js";
import { escapeRegExp } from "../utils/regexUtils.js";
import { passwordSchema } from "../utils/validationUtils.js";
import { findActivePermissionsForUser, hasAtLeastOneContributeurNotPending } from "./permissions.actions.js";

/**
 * Méthode de création d'un utilisateur
 * @param {*} userProps
 * @returns
 */
export const createUser = async ({ email, password }, options = {}) => {
  const passwordHash = options.hash || hashUtil(password);
  const permissions = options.permissions || {};

  const {
    civility,
    nom,
    prenom,
    telephone,
    siret,
    uai,
    organisation,
    account_status,
    custom_acl,
    orign_register,
    roles,
    description,
    reseau,
    erp,
    codes_region,
    codes_academie,
    codes_departement,
  } = options;

  let rolesMatchIds = [];
  if (roles && roles.length > 0) {
    rolesMatchIds = await rolesDb()
      .find({ name: { $in: roles } }, { projection: { _id: 1 } })
      .toArray();
    rolesMatchIds = rolesMatchIds.map(({ _id }) => _id);
    if (!rolesMatchIds.length === 0) {
      throw new Error("Roles doesn't exist");
    }
  }

  // Vérification de l'existence de l'email - même si on a un index unique
  const existingUserEmail = await usersMigrationDb().findOne({ email });
  if (existingUserEmail) throw new Error("User with this email already exists");

  const { insertedId } = await usersMigrationDb().insertOne(
    validateUser({
      ...defaultValuesUser(),
      email: email.toLowerCase(),
      password: passwordHash,
      is_admin: !!permissions.is_admin,
      is_cross_organismes: !!permissions.is_cross_organismes,
      ...(civility ? { civility } : {}),
      ...(nom ? { nom } : {}),
      ...(prenom ? { prenom } : {}),
      ...(telephone ? { telephone } : {}),
      ...(siret ? { siret } : {}),
      ...(uai ? { uai } : {}),
      ...(account_status ? { account_status } : {}),
      ...(custom_acl ? { custom_acl } : {}),
      ...(roles ? { roles: rolesMatchIds } : {}),
      ...(orign_register ? { orign_register } : {}),
      ...(description ? { description } : {}),
      ...(organisation ? { organisation } : {}),
      ...(reseau ? { reseau } : {}),
      ...(erp ? { erp } : {}),
      ...(codes_region ? { codes_region } : {}),
      ...(codes_academie ? { codes_academie } : {}),
      ...(codes_departement ? { codes_departement } : {}),
    })
  );

  return await usersMigrationDb().findOne({ _id: insertedId });
};

/**
 * Méthode de rehash du password de l'utilisateur
 * @param {*} user
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
export const getUser = async (email) => {
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
 * Méthode de récupération d'un user depuis son id
 * @param {*} _id
 * @returns
 */
export const getUserById = async (_id, projection = {}) => {
  const user = await usersMigrationDb().findOne({ _id }, { projection });

  if (!user) {
    throw new Error("Unable to find user");
  }

  return user;
};

/**
 * Méthode de récupération de la liste des utilisateurs en base
 * @param {*} query
 * @returns
 */
export const getAllUsers = async (query = {}) =>
  await usersMigrationDb()
    .find(query, { projection: { password: 0, __v: 0 } })
    .toArray();

/**
 * Méthode de suppression d'un user depuis son id
 * @param {*} _id
 * @returns
 */
export const removeUser = async (_idStr) => {
  const _id = ObjectId(_idStr);
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
  const user = await usersMigrationDb().findOne({ _id: ObjectId(_id) });

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

  const main_organisme_id = typeof id === "string" ? ObjectId(organisme_id) : organisme_id;
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
  const permissions = pick(user, ["is_admin", "is_cross_organismes"]);
  const rolesList = user.roles?.length
    ? await rolesDb()
        .find({ _id: { $in: user.roles } })
        .toArray()
    : [];
  const rolesAcl = rolesList.reduce((acc, { acl }) => [...acc, ...acl], []);

  const activePermissions = await findActivePermissionsForUser({ userEmail: user.email }, { organisme_id: 1, _id: 0 });
  const organisme_ids = compact(activePermissions.map(({ organisme_id }) => organisme_id));

  const hasAccessToOnlyOneOrganisme = organisme_ids.length === 1;
  const isInPendingValidation = !organisme_ids.length && !activePermissions.length;
  const hasAtLeastOneUserToValidate = user.main_organisme_id
    ? await hasAtLeastOneContributeurNotPending(user.main_organisme_id, "organisme.admin")
    : false;

  let specialAcl = [];
  if (!hasAccessToOnlyOneOrganisme || permissions.is_cross_organismes) {
    specialAcl = ["page/mes-organismes"];
  }

  return {
    organisme_ids,
    main_organisme_id: user.main_organisme_id,
    permissions,
    isInPendingValidation,
    hasAtLeastOneUserToValidate,
    email: user.email,
    civility: user.civility,
    nom: user.nom,
    prenom: user.prenom,
    telephone: user.telephone,
    siret: user.siret,
    uai: user.uai,
    description: user.description,
    organisation: user.organisation,
    reseau: user?.reseau,
    erp: user?.erp,
    codes_region: user.codes_region, // TODO [tech] send full regions
    codes_academie: user.codes_academie, // TODO [tech] send full académie
    codes_departement: user.codes_departement, // TODO [tech] send full department
    account_status: user.account_status,
    roles: rolesList.map(({ name }) => name),
    acl: uniq([...rolesAcl, ...(user?.custom_acl ? user.custom_acl : []), ...specialAcl]),
    orign_register: user.orign_register,
    has_accept_cgu_version: user.has_accept_cgu_version,
  };
};

export const loggedInUser = async (email) => {
  await usersMigrationDb().findOneAndUpdate(
    { email },
    {
      $set: {
        last_connection: new Date(),
      },
      $push: { connection_history: new Date() },
    }
  );
};

export const activateUser = async (email) => {
  const user = await usersMigrationDb().findOne({ email });
  if (!user) {
    throw new Error("Unable to find user");
  }

  const updated = await usersMigrationDb().findOneAndUpdate(
    { _id: user._id },
    {
      $set: {
        account_status: "FIRST_FORCE_RESET_PASSWORD",
      },
    },
    { returnDocument: "after" }
  );

  return updated.value;
};

export const userHasAskAccess = async (email, data) => {
  const user = await usersMigrationDb().findOne({ email });
  if (!user) {
    throw new Error("Unable to find user");
  }

  const updated = await usersMigrationDb().findOneAndUpdate(
    { _id: user._id },
    {
      $set: {
        account_status: "FORCE_COMPLETE_PROFILE_STEP2",
        ...data,
      },
    },
    { returnDocument: "after" }
  );

  return updated.value;
};

export const finalizeUser = async (email, data) => {
  const user = await usersMigrationDb().findOne({ email });
  if (!user) {
    throw new Error("Unable to find user");
  }

  const updated = await usersMigrationDb().findOneAndUpdate(
    { _id: user._id },
    {
      $set: {
        account_status: "CONFIRMED",
        ...data,
      },
    },
    { returnDocument: "after" }
  );

  return updated.value;
};

/**
 * Méthode de mise à jour du mot de passe d'un user
 * @param {*} _id
 * @returns
 */
export const changePassword = async (email, newPassword) => {
  const user = await usersMigrationDb().findOne({ email });
  if (!user) {
    throw new Error("Unable to find user");
  }

  if (passwordSchema(user.is_admin).required().validate(newPassword).error) {
    throw new Error("Password must be valid");
  }

  let account_status = user.account_status;
  if (user.account_status === "FIRST_FORCE_RESET_PASSWORD") {
    account_status = "FORCE_COMPLETE_PROFILE_STEP1";
  } else if (user.account_status === "FORCE_RESET_PASSWORD") {
    account_status = "CONFIRMED";
  }

  const updated = await usersMigrationDb().findOneAndUpdate(
    { _id: user._id },
    {
      $set: {
        account_status,
        password: hashUtil(newPassword),
        password_updated_at: new Date(),
      },
    },
    { returnDocument: "after" }
  );

  return updated.value;
};

/**
 * Méthode de recherche d'utilisateurs selon plusieurs critères
 * @param {*} searchTerm
 * @returns
 */
export const searchUsers = async (searchTerm) => {
  const matchStage = {};
  if (searchTerm) {
    matchStage.$or = [
      { email: new RegExp(escapeRegExp(searchTerm), "i") },
      { nom: new RegExp(escapeRegExp(searchTerm), "i") },
    ];
  }

  const sortStage = { nom: 1 };

  const found = await usersMigrationDb().aggregate([{ $match: matchStage }, { $sort: sortStage }]);

  return found.toArray();
};

/**
 * Génération d'un token d'update de mot de passe
 * @param {*} email
 * @returns
 */
export const generatePasswordUpdateToken = async (email) => {
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
