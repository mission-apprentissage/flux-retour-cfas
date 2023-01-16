import { ObjectId } from "mongodb";
import { permissionsDb } from "../model/collections.js";
import { defaultValuesPermission, validatePermission } from "../model/next.toKeep.models/permissions.model.js";
import { findRoleByName } from "./roles.actions.js";

/**
 * Méthode de création d'une permission
 * @param {*} permissionProps
 * @returns
 */
export const createPermission = async ({
  organisme_id = null,
  userEmail,
  roleName,
  pending = true,
  custom_acl = [],
}) => {
  const roleDb = await findRoleByName(roleName);
  if (!roleDb) {
    throw new Error("Role doesn't exist");
  }

  const { insertedId } = await permissionsDb().insertOne(
    validatePermission({
      ...defaultValuesPermission(),
      organisme_id,
      userEmail: userEmail.toLowerCase(),
      role: roleDb._id,
      custom_acl,
      pending,
    })
  );

  return await permissionsDb().findOne({ _id: insertedId });
};

/**
 * Méthode de récupération de permissions versatile par query
 * @param {*} query
 * @param {*} projection
 * @returns
 */
export const findPermissionsByQuery = async (query, projection = {}) => {
  return await permissionsDb().find(query, { projection }).toArray();
};

export const findActivePermissionsForUser = async ({ userEmail }, projection = {}) => {
  return await permissionsDb().find({ pending: false, userEmail: userEmail.toLowerCase() }, { projection }).toArray();
};

export const hasPermission = async ({ organisme_id, userEmail }, projection = {}) => {
  return await permissionsDb().findOne(
    { organisme_id: organisme_id ? ObjectId(organisme_id) : null, userEmail: userEmail.toLowerCase() },
    { projection }
  );
};

export const findActivePermissionsByRoleName = async (organisme_id, roleName, projection = {}) => {
  const roleDb = await findRoleByName(roleName, { _id: 1 });
  if (!roleDb) {
    throw new Error("Role doesn't exist");
  }

  return await findPermissionsByQuery({ organisme_id, role: roleDb._id, pending: false }, projection);
};

export const findPermissionByUserEmail = async (organisme_id, userEmail, projection = {}) => {
  return permissionsDb().findOne({ organisme_id, userEmail: userEmail.toLowerCase() }, { projection });
};

export const findPermissionsByUserEmail = async ({ userEmail }, projection = {}) => {
  return await permissionsDb().find({ userEmail: userEmail.toLowerCase() }, { projection }).toArray();
};

export const hasAtLeastOneContributeurNotPending = async (organisme_id, roleName = "organisme.admin") => {
  const roleDb = await findRoleByName(roleName, { _id: 1 });
  if (!roleDb) {
    throw new Error("Role doesn't exist");
  }

  const permissions = await findPermissionsByQuery({ organisme_id, role: roleDb._id }, { pending: 1 });
  return !!permissions.find(({ pending }) => !pending);
};

/**
 * Méthode de mise à jour d'une permission
 * @param {*} permissionProps
 * @returns
 */
export const updatePermission = async ({ organisme_id, userEmail, roleName, custom_acl = [] }) => {
  const roleDb = await findRoleByName(roleName);
  if (!roleDb) {
    throw new Error("Role doesn't exist");
  }

  const permission = await findPermissionByUserEmail(organisme_id, userEmail.toLowerCase());
  if (!permission) {
    throw new Error(`Unable to find permission for userEmail ${userEmail} and organisme_id ${organisme_id}`);
  }

  const updated = await permissionsDb().findOneAndUpdate(
    { _id: permission._id },
    {
      $set: {
        role: roleDb._id,
        custom_acl,
        updated_at: new Date(),
      },
    },
    { returnDocument: "after" }
  );

  return updated.value;
};

/**
 * Méthode de mise à jour d'activation d'acces
 * @param {*} permissionProps
 * @returns
 */
export const updatePermissionPending = async ({ organisme_id, userEmail, pending }) => {
  const permission = await findPermissionByUserEmail(ObjectId(organisme_id), userEmail.toLowerCase());
  if (!permission) {
    throw new Error(
      `Unable to find permission for userEmail ${userEmail.toLowerCase()} and organisme_id ${organisme_id}`
    );
  }

  const updated = await permissionsDb().findOneAndUpdate(
    { _id: permission._id },
    {
      $set: {
        pending,
        updated_at: new Date(),
      },
    },
    { returnDocument: "after" }
  );

  return updated.value;
};

/**
 * Méthode de mise à jour d'activation d'acces
 * @param {*} permissionProps
 * @returns
 */
export const updatePermissionsPending = async ({ userEmail, pending }) => {
  const permissions = await findPermissionsByUserEmail({ userEmail: userEmail.toLowerCase() }, { _id: 1 });
  if (!permissions && !permissions.length) {
    throw new Error(`Unable to find permissions for userEmail ${userEmail.toLowerCase()}`);
  }

  await permissionsDb().updateMany(
    { _id: { $in: [permissions.map(({ _id }) => _id)] } },
    {
      $set: {
        pending,
        updated_at: new Date(),
      },
    },
    { returnDocument: "after" }
  );
};

/**
 * Méthode de suppression de permission
 * @param {ObjectId} _id
 * @returns
 */
export const removePermission = async (_id) => {
  const permission = await permissionsDb().findOne({ _id });
  if (!permission) {
    throw new Error(`Unable to find permission ${_id}`);
  }
  return permissionsDb().deleteOne({ _id });
};
