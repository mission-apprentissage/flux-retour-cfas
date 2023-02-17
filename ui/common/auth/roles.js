export const hasUserRoles = (auth, roles = []) => {
  if (!auth || !auth.roles || auth.roles.length === 0) return false;

  const rolesToCheck = Array.isArray(roles) ? roles : [roles];
  return rolesToCheck.some((item) => auth.roles.includes(item));
};

export const roles = {
  administrator: "administrator",
  pilot: "pilot",
  network: "network",
  cfa: "cfa",
};
