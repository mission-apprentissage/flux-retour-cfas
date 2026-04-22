import Boom from "boom";
import express from "express";
import { ObjectId } from "mongodb";
import { z } from "zod";

import {
  cancelAdminInvitation,
  getOrganisationCounts,
  getOrganismeCounts,
  listAdminInvitations,
  resendAdminInvitation,
} from "@/common/actions/admin/invitations.admin.actions";
import { validateFullZodObjectSchema } from "@/common/utils/validationUtils";
import { returnResult } from "@/http/middlewares/helpers";

const zListQuery = {
  status: z.enum(["pending", "consumed"]).default("pending"),
  type: z.string().optional(),
  role: z.enum(["admin", "member"]).optional(),
  organisation_id: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().optional(),
};

export default () => {
  const router = express.Router();

  router.get(
    "/",
    returnResult(async (req) => {
      const query = await validateFullZodObjectSchema(req.query, zListQuery);
      return await listAdminInvitations(query);
    })
  );

  router.delete(
    "/:id",
    returnResult(async (req) => {
      if (!ObjectId.isValid(req.params.id)) {
        throw Boom.badRequest("ID invalide");
      }
      await cancelAdminInvitation(req.params.id);
      return { ok: true };
    })
  );

  router.post(
    "/:id/resend",
    returnResult(async (req) => {
      if (!ObjectId.isValid(req.params.id)) {
        throw Boom.badRequest("ID invalide");
      }
      return await resendAdminInvitation(req.params.id);
    })
  );

  router.get(
    "/counts/:organisationId",
    returnResult(async (req) => {
      if (!ObjectId.isValid(req.params.organisationId)) {
        throw Boom.badRequest("ID d'organisation invalide");
      }
      return await getOrganisationCounts(req.params.organisationId);
    })
  );

  router.get(
    "/counts/organisme/:organismeId",
    returnResult(async (req) => {
      if (!ObjectId.isValid(req.params.organismeId)) {
        throw Boom.badRequest("ID d'organisme invalide");
      }
      return await getOrganismeCounts(req.params.organismeId);
    })
  );

  return router;
};
