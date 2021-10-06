import { some } from "lodash";

export const isUserInRole = (auth, role) =>
  auth && auth.permissions && some(auth.permissions, (item) => role.includes(item));

export const isUserAdmin = (auth) => isUserInRole(auth, roles.administrator);

const roles = {
  administrator: "administrator",
  pilot: "pilot",
  network: "network",
};
