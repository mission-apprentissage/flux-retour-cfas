import Boom from "boom";
import { ObjectId } from "bson";
import express from "express";

import { getCfaEffectifsEnRupture } from "@/common/actions/cfa/cfa-effectifs-ruptures.actions";
import { getOrganisationOrganismeByOrganismeId } from "@/common/actions/organisations.actions";
import { organismesDb } from "@/common/model/collections";
import { returnResult } from "@/http/middlewares/helpers";

export default () => {
  const router = express.Router();

  router.get("/effectifs-ruptures", returnResult(getCfaEffectifsRuptureHandler));

  return router;
};

const getCfaEffectifsRuptureHandler = async (_req, { locals }) => {
  const organisme = await getOrganisationOrganismeByOrganismeId(locals.organismeId);
  if (!organisme) {
    throw Boom.notFound("No organisme found for the provided ID");
  }

  if (organisme.type !== "ORGANISME_FORMATION") {
    throw Boom.forbidden("This endpoint is only available for CFA organisations");
  }

  if (!organisme.organisme_id) {
    throw Boom.badData("Organisation has no organisme_id");
  }

  const organismeDoc = await organismesDb().findOne(
    { _id: new ObjectId(organisme.organisme_id) },
    { projection: { is_allowed_deca: 1 } }
  );

  return await getCfaEffectifsEnRupture(organisme, organismeDoc?.is_allowed_deca ?? false);
};
