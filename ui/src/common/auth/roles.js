export const hasUserRoles = (auth, roles = []) => {
  if (!auth || !auth.permissions || auth.permissions.length === 0) return false;

  const rolesToCheck = Array.isArray(roles) ? roles : [roles];
  return rolesToCheck.some((item) => auth.permissions.includes(item));
};

export const roles = {
  administrator: "administrator",
  pilot: "pilot",
  network: "network",
};
