export const pageAccessMiddleware = (acl: string[] = []) => {
  return ({ user }, res, next) => {
    if (user?.is_admin || acl.every((page) => user?.acl.includes(page))) {
      return next();
    }
    return res.status(403).json({ message: "Accès non autorisé" });
  };
};
