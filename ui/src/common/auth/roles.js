import { getAuthUserNetwork, getAuthUserRole } from "./auth";

export const hasUserRoles = (auth, roles = []) => {
  if (!auth || !auth.permissions || auth.permissions.length === 0) return false;

  const rolesToCheck = Array.isArray(roles) ? roles : [roles];
  return rolesToCheck.some((item) => auth.permissions.includes(item));
};

export const getFilteredQueryForUser = (initialQuery) => {
  const userRole = getAuthUserRole();
  if (userRole === roles.administrator || userRole === roles.pilot) return initialQuery;
  if (userRole === roles.network) return { ...initialQuery, etablissement_reseaux: getAuthUserNetwork() ?? "" };
  return { searchTerm: null, etablissement_num_region: null, etablissement_num_departement: null };
};

export const roles = {
  administrator: "administrator",
  pilot: "pilot",
  network: "network",
};
