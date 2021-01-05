import { some } from "lodash";

export const isUserInRole = (auth, role) =>
  auth && auth.permissions && some(auth.permissions, (item) => role.includes(item));

export const isUserAdmin = (auth) => isUserInRole(auth, roles.administrator);

export const roles = {
  role1: "role1",
  role2: "role2",
  administrator: "administrator",
};
