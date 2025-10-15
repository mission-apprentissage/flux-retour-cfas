import Boom from "boom";
import express from "express";
import { getWarningOnEmail } from "shared/models/data/organisations.model";
import { zPostAdminAddMembreToFranceTravail, zPostAdminAddMembreToMissionLocale } from "shared/models/routes/admin/users.api";

import { activateMissionLocaleAtAdminValidation } from "@/common/actions/admin/mission-locale/mission-locale.admin.actions";
import { getOrCreateMissionLocaleById } from "@/common/actions/mission-locale/mission-locale.actions";
import { inviteUserToOrganisation, rejectMembre, validateMembre } from "@/common/actions/organisations.actions";
import {
  getAllUsers,
  getAllUsersForExport,
  getDetailedUserById,
  removeUser,
  resendConfirmationEmail,
  updateUser,
} from "@/common/actions/users.actions";
import { buildFiltersFromQuery } from "@/common/utils/usersFiltersUtils";
import { validateFullZodObjectSchema } from "@/common/utils/validationUtils";
import objectIdSchema from "@/common/validation/objectIdSchema";
import userSchema from "@/common/validation/userSchema";
import usersFiltersSchema, { UsersFiltersParams } from "@/common/validation/usersFiltersSchema";
import { returnResult } from "@/http/middlewares/helpers";
import validateRequestMiddleware from "@/http/middlewares/validateRequestMiddleware";
import { getFranceTravailOrganisationByCodeRegion } from "@/common/actions/franceTravail/franceTravailEffectif.actions";

export default () => {
  const router = express.Router();

  router.get(
    "/",
    validateRequestMiddleware({
      query: usersFiltersSchema(),
    }),
    async (req, res) => {
      const { page, limit, sort } = req.query as UsersFiltersParams;
      const query = buildFiltersFromQuery(req.query as UsersFiltersParams);
      const result = await getAllUsers(query, { page, limit, sort });
      return res.json(result);
    }
  );

  router.get(
    "/export",
    validateRequestMiddleware({
      query: usersFiltersSchema(),
    }),
    async (req, res) => {
      const { sort } = req.query as unknown as UsersFiltersParams;
      const query = buildFiltersFromQuery(req.query as unknown as UsersFiltersParams);
      const users = await getAllUsersForExport(query, { sort });
      return res.json(users);
    }
  );

  router.put(
    "/:id/validate",
    returnResult(async (req) => {
      await validateMembre(req.user, req.params.id);
    })
  );

  router.put(
    "/:id/reject",
    returnResult(async (req) => {
      await rejectMembre(req.user, req.params.id);
    })
  );

  router.put(
    "/:id",
    validateRequestMiddleware({
      params: objectIdSchema("id"),
      body: userSchema().strict(),
    }),
    async ({ body, params }, res) => {
      const { id } = params;

      await updateUser(id as string, body);
      const user = await getDetailedUserById(id as string);
      if (!user) {
        throw Boom.notFound(`User with id ${id} not found`);
      }

      res.json({ ok: true });
    }
  );

  router.get(
    "/:id",
    validateRequestMiddleware({
      params: objectIdSchema("id"),
    }),
    async ({ params }, res) => {
      const { id } = params;
      const user = await getDetailedUserById(id as string);
      if (!user) {
        throw Boom.notFound(`User with id ${id} not found`);
      }

      let warning = getWarningOnEmail(user.email, user.organisation);

      res.json({ user, warning });
    }
  );

  router.delete(
    "/:id",
    validateRequestMiddleware({
      params: objectIdSchema("id"),
    }),
    async ({ params }, res) => {
      const { id } = params;

      await removeUser(id);

      res.json({ ok: true, message: `User ${id} deleted !` });
    }
  );

  router.post(
    "/:id/resend-confirmation-email",
    validateRequestMiddleware({
      params: objectIdSchema("id"),
    }),
    returnResult(async (req) => {
      await resendConfirmationEmail(req.params.id as string);
    })
  );

  router.post(
    "/mission-locale/membre",
    returnResult(async (req) => {
      const body = await validateFullZodObjectSchema(req.body, zPostAdminAddMembreToMissionLocale);
      const { email, mission_locale_id } = body;
      const organisation = await getOrCreateMissionLocaleById(mission_locale_id);
      if (!organisation) {
        throw Boom.notFound("Mission locale not found");
      }
      await inviteUserToOrganisation(req.user, email, organisation._id);
      await activateMissionLocaleAtAdminValidation(organisation._id, new Date());
    })
  );

  router.post(
    "/france-travail/membre",
    returnResult(async (req) => {
      const body = await validateFullZodObjectSchema(req.body, zPostAdminAddMembreToFranceTravail);
      const { email, code_region } = body;
      const organisation = await getFranceTravailOrganisationByCodeRegion(code_region);
      if (!organisation) {
        throw Boom.notFound("France Travail organisation not found");
      }
      await inviteUserToOrganisation(req.user, email, organisation._id);
    })
  );

  return router;
};
