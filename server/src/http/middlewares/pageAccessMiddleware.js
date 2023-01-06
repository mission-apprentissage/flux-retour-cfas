import { isEqual, pick } from "lodash-es";

export const pageAccessMiddleware = (acl = []) => {
  return ({ user }, res, next) => {
    const permissions = { is_admin: true };
    const current = pick(user?.permissions, Object.keys(permissions));

    if (!(isEqual(current, permissions) || acl.every((page) => user?.acl.includes(page)))) {
      // TBD: change to 403 ?
      return res.status(401).json({ message: "Accès non autorisé" });
    }

    next();
  };
};
