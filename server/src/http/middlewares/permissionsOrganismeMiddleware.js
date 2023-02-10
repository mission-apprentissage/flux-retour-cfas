import Joi from "joi";
import Boom from "boom";
import tryCatch from "./tryCatchMiddleware.js";
import { findRolePermissionById, hasAclsByRoleId } from "../../common/actions/roles.actions.js";
import { hasPermission } from "../../common/actions/permissions.actions.js";
import { findOrganismeById } from "../../common/actions/organismes/organismes.actions.js";
import { USER_ACCOUNT_STATUS } from "../../common/constants/usersConstants.js";

const hasRightsTo = async (role, acls) => {
  const hasRight = await hasAclsByRoleId(role, acls);
  if (!hasRight) {
    throw Boom.badRequest("Accès non autorisé");
  }
};

export default (acls) =>
  tryCatch(async ({ method, body, query, user, baseUrl, route }, res, next) => {
    const validAccountStatus = [
      USER_ACCOUNT_STATUS.FORCE_COMPLETE_PROFILE_STEP1,
      USER_ACCOUNT_STATUS.FORCE_COMPLETE_PROFILE_STEP2,
      USER_ACCOUNT_STATUS.CONFIRMED,
    ];
    if (!validAccountStatus.includes(user.account_status)) {
      throw Boom.unauthorized("Accès non autorisé");
    }
    const data =
      baseUrl === "/api/v1/upload" && route.path === "/" && method === "POST"
        ? query
        : method === "GET" || method === "DELETE"
        ? query
        : body;

    const isTransverseUser =
      user.permissions.is_admin ||
      (user.permissions.is_cross_organismes &&
        !user.codes_region.length &&
        !user.codes_academie.length &&
        !user.codes_departement.length);

    let permission = null;
    if (isTransverseUser) {
      // TODO [tech] HANDLE specific permission given (by the organisme.admin); find if other perms exist
      // for instance => support or help a of
      permission = await hasPermission({ organisme_id: null, userEmail: user.email });
    } else {
      let { organisme_id } = await Joi.object({
        organisme_id: Joi.string().required(),
      })
        .unknown()
        .validateAsync(data, { abortEarly: false });

      const organisme = await findOrganismeById(organisme_id);
      if (!organisme) {
        throw Boom.unauthorized("Accès non autorisé");
      }

      if (user.permissions.is_cross_organismes) {
        if (
          !user.codes_region.includes(organisme.adresse.region) &&
          !user.codes_academie.includes(organisme.adresse.academie) &&
          !user.codes_departement.includes(organisme.adresse.departement)
        ) {
          throw Boom.unauthorized("Accès non autorisé");
        }
      } else {
        if (user.reseau && !organisme.reseaux.includes(user.reseau)) {
          throw Boom.unauthorized("Accès non autorisé");
        }
        if (user.erp && !organisme.erps.includes(user.erp)) {
          throw Boom.unauthorized("Accès non autorisé");
        }
      }

      permission = await hasPermission({ organisme_id, userEmail: user.email });
    }

    if (!permission) {
      throw Boom.unauthorized("Accès non autorisé");
    }
    if (permission.pending) {
      throw Boom.unauthorized("Accès non autorisé, en cours d'acceptation");
    }

    await hasRightsTo(permission.role, acls);

    const currentPermissionRole = await findRolePermissionById(permission.role, { acl: 1 });
    if (!currentPermissionRole) {
      throw Boom.badRequest("Something went wrong");
    }

    user.currentPermissionAcl = currentPermissionRole.acl;

    next();
  });
