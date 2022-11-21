import Joi from "joi";
import Boom from "boom";
import tryCatch from "./tryCatchMiddleware.js";
import { findRolePermissionById, hasAclsByRoleId } from "../../common/actions/roles.actions.js";
import { hasPermission } from "../../common/actions/permissions.actions.js";

export default (acls) =>
  tryCatch(async ({ method, body, query, user }, res, next) => {
    if (user.account_status !== "CONFIRMED") {
      throw Boom.unauthorized("Accès non autorisé");
    }
    const data = method === "GET" || method === "DELETE" ? query : body;

    let { organisme_id } = await Joi.object({
      organisme_id: Joi.string().required(),
    })
      .unknown()
      .validateAsync(data, { abortEarly: false });

    const hasRightsTo = async (role, acls) => {
      const hasRight = await hasAclsByRoleId(role, acls);
      if (!hasRight) {
        throw Boom.badRequest("Accès non autorisé");
      }
    };

    const permission = await hasPermission({ organisme_id, userEmail: user.email });
    if (!permission) {
      throw Boom.unauthorized("Accès non autorisé");
    }
    await hasRightsTo(permission.role, acls);

    const currentPermissionRole = await findRolePermissionById(permission.role, { acl: 1 });
    if (!currentPermissionRole) {
      throw Boom.badRequest("Something went wrong");
    }

    user.currentPermissionAcl = currentPermissionRole.acl;

    next();
  });
