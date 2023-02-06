import { ObjectId } from "mongodb";

import { rolesDb } from "../model/collections.js";
import { defaultValuesRole } from "../model/roles.model.js";

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

/**
 * Méthode de récupération de la liste des roles en base
 *
 * @param {*} query
 * @returns
 */
export const getAllRoles = async (query = {}) =>
  await rolesDb()
    .find(query, { projection: { __v: 0 } })
    .toArray();

export const findRolePermission = async (query, projection = {}) => {
  const roles = await rolesDb()
    .find({ ...query, type: "permission" }, { projection })
    .toArray();
  return roles;
};

export const findRolePermissionById = async (id, projection = {}) => {
  const role = await rolesDb().findOne({ _id: ObjectId(id), type: "permission" }, { projection });
  return role;
};

export const findRolesByNames = async (names, projection = {}) => {
  return await rolesDb()
    .find({ name: { $in: names } }, { projection })
    .toArray();
};

/**
 * Méthode de récupération d'un role depuis un nom
 * @param {string} name
 * @param {*} projection
 * @returns
 */
export const findRoleByName = async (name, projection = {}) => {
  return await rolesDb().findOne({ name }, { projection });
};

export const findRoleById = async (id, projection = {}) => {
  const role = await rolesDb().findOne({ _id: ObjectId(id) }, { projection });
  return role;
};

export const hasAclsByRoleId = async (id, acl) => {
  const roleDb = await rolesDb().findOne({ _id: ObjectId(id) }, { acl: 1 });
  if (!roleDb) {
    throw new Error("Role doesn't exist");
  }

  return acl.every((page) => roleDb.acl.includes(page));
};
