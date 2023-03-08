import { ObjectId } from "mongodb";
import { permissionsDb } from "../model/collections.js";
import { defaultValuesPermission, validatePermission } from "../model/permissions.model.js";
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
 * Méthode de récupération de la liste des permissions en base
 * @returns
 */
export const getAllPermissions = async () =>
  await permissionsDb()
    .aggregate([
      {
        $lookup: {
          from: "roles",
          localField: "role",
          foreignField: "_id",
          as: "role",
        },
      },
      { $unwind: "$role" },
      { $addFields: { role: "$role.name" } },
      {
        $lookup: {
          from: "organismes",
          localField: "organisme_id",
          foreignField: "_id",
          as: "organisme",
        },
      },
      { $unwind: "$organisme" },
      {
        $addFields: {
          organismeTmp: {
            _id: "$organisme._id",
            nom: "$organisme.nom",
            uai: "$organisme.uai",
            siret: "$organisme.siret",
          },
        },
      },
      { $addFields: { organisme: "$organismeTmp" } },
      { $unset: ["organismeTmp"] },
    ])
    .toArray();

export const findActivePermissionsForUser = async ({ userEmail }, projection = {}) => {
  return await permissionsDb().find({ pending: false, userEmail: userEmail.toLowerCase() }, { projection }).toArray();
};

export const hasPermission = async ({ organisme_id, userEmail }, projection = {}) => {
  return await permissionsDb().findOne(
    { organisme_id: organisme_id ? new ObjectId(organisme_id) : null, userEmail: userEmail.toLowerCase() },
    { projection }
  );
};

export const findActivePermissionsByRoleName = async (organisme_id, roleName, projection = {}) => {
  const roleDb = await findRoleByName(roleName, { _id: 1 });
  if (!roleDb) {
    throw new Error("Role doesn't exist");
  }

  return permissionsDb().find({ organisme_id, role: roleDb._id, pending: false }, { projection }).toArray();
};

const findPermissionByUserEmail = async (organisme_id, userEmail, projection = {}) => {
  return permissionsDb().findOne({ organisme_id, userEmail: userEmail.toLowerCase() }, { projection });
};

const findPermissionsByUserEmail = async (organisme_id, userEmail, projection = {}) => {
  return await permissionsDb()
    .find(
      {
        ...(organisme_id ? { organisme_id: new ObjectId(organisme_id) } : {}),
        userEmail: userEmail.toLowerCase(),
      },
      { projection }
    )
    .toArray();
};

export const hasAtLeastOneContributeurNotPending = async (organisme_id, roleName = "organisme.admin") => {
  const roleDb = await findRoleByName(roleName, { _id: 1 });
  if (!roleDb) {
    throw new Error("Role doesn't exist");
  }

  const permission = await permissionsDb().findOne({ organisme_id, role: roleDb._id, pending: false });
  return !!permission;
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
 * Méthode de mise à jour d'activation d'accès
 * @param {*} permissionProps
 * @returns
 */
export const updatePermissionsPending = async ({ userEmail, pending, organisme_id }) => {
  const permissions = await findPermissionsByUserEmail(organisme_id, userEmail, { _id: 1 });
  if (!permissions && !permissions.length) {
    throw new Error(`Unable to find permissions for userEmail ${userEmail.toLowerCase()}`);
  }

  return permissionsDb().updateMany(
    { _id: { $in: permissions.map(({ _id }) => _id) } },
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
 * Méthode de suppression de permissions
 * @param {Object} options
 * @param {string} options.userEmail
 * @param {string|null|ObjectId} options.organisme_id
 * @returns
 */
export const removePermissions = async ({ userEmail, organisme_id }) => {
  const permissions = await findPermissionsByUserEmail(organisme_id, userEmail, { _id: 1 });
  if (!permissions && !permissions.length) {
    throw new Error(
      `Unable to find permissions for userEmail ${userEmail.toLowerCase()} and organisme ${organisme_id}`
    );
  }

  return permissionsDb().deleteMany({
    _id: {
      $in: permissions.map(({ _id }) => _id),
    },
  });
};
