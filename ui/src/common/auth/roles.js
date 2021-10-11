import { some } from "lodash";

export const isUserAuthorizedForRoles = (auth, roles) =>
  auth && auth.permissions && some(roles, (item) => auth.permissions.includes(item));

export const roles = {
  administrator: "administrator",
  pilot: "pilot",
  network: "network",
};
