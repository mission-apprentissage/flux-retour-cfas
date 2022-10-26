export const hasUserRoles = (auth, roles = []) => {
  if (!auth || !auth.permissions || auth.permissions.length === 0) return false;

  const rolesToCheck = Array.isArray(roles) ? roles : [roles];
  return rolesToCheck.some((item) => auth.permissions.includes(item));
};

export const hasUserPartageSimplifieRole = (auth, authorizedRole) => auth.role === authorizedRole;

export const roles = {
  administrator: "administrator",
  pilot: "pilot",
  network: "network",
  cfa: "cfa",
};

export const PARTAGE_SIMPLIFIE_ROLES = {
  ADMINISTRATOR: "administrator",
  OF: "of",
};
