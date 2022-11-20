import { rolesDb } from "../model/collections.js";
import { defaultValuesRole } from "../model/next.toKeep.models/roles.model.js";
import { ObjectId } from "mongodb";
/**
 * Méthode de création d'un rôle
 * @param {*} roleProps
 * @returns
 */
export const createRole = async ({ name, type, acl, title, description }) => {
  const { insertedId } = await rolesDb().insertOne({
    ...defaultValuesRole(),
    type,
    name,
    ...(acl ? { acl } : {}),
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
  });

  return insertedId;
};

export const findRolePermission = async (query, projection = {}) => {
  const roles = await rolesDb()
    .find({ ...query, type: "permission" }, { projection })
    .toArray();
  return roles;
};

export const findRolePermissionById = async (id, projection = {}) => {
  const _id = typeof id === "string" ? ObjectId(id) : id;
  const role = await rolesDb().findOne({ _id, type: "permission" }, { projection });
  return role;
};

export const findRolesByNames = async (names, projection = {}) => {
  const roles = await rolesDb()
    .find({ name: { $in: names } }, { projection })
    .toArray();
  return roles;
};

export const findRoleById = async (id, projection = {}) => {
  const _id = typeof id === "string" ? ObjectId(id) : id;
  const role = await rolesDb().findOne({ _id }, { projection });
  return role;
};

export const hasAclsByRoleId = async (id, acl) => {
  const _id = typeof id === "string" ? ObjectId(id) : id;
  const roleDb = await rolesDb().findOne({ _id }, { acl: 1 });
  if (!roleDb) {
    throw new Error("Role doesn't exist");
  }

  return acl.every((page) => roleDb.acl.includes(page));
};
