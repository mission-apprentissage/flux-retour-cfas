import { ObjectId } from "mongodb";
import { permissionsDb } from "../model/collections.js";
import { defaultValuesPermission, validatePermission } from "../model/next.toKeep.models/permissions.model.js";
import { findRoleByName } from "./roles.actions.js";

/**
 * Méthode de création d'une permission
 * @param {*} permissionProps
 * @returns
 */
export const createPermission = async ({ organisme_id = null, userEmail, role, pending = true, custom_acl = [] }) => {
  const roleDb = await findRoleByName(role);
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

/**
 * Méthode de mise à jour d'une permission
 * @param {*} permissionProps
 * @returns
 */
export const updatePermission = async ({ organisme_id, userEmail, roleId, custom_acl = [] }) => {
  const permission = await permissionsDb().findOne({ organisme_id, userEmail: userEmail.toLowerCase() });
  if (!permission) {
    throw new Error(`Unable to find permission`);
  }

  const role = typeof id === "string" ? ObjectId(roleId) : roleId;
  if (!ObjectId.isValid(role)) throw new Error("Invalid role id passed");

  const updated = await permissionsDb().findOneAndUpdate(
    { _id: permission._id },
    {
      $set: {
        role,
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
  const permission = await permissionsDb().findOne({ organisme_id, userEmail: userEmail.toLowerCase() });
  if (!permission) {
    throw new Error(`Unable to find permission`);
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
 * Méthode de suppression de permission
 * @param {*} permissionProps
 * @returns
 */
export const removePermission = async ({ _id }) => {
  const permission = await permissionsDb().findOne({ _id });
  if (!permission) {
    throw new Error(`Unable to find permission`);
  }

  await permissionsDb().deleteOne({ _id });
};
