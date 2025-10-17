import express from "express";
import { IOrganisationFranceTravail } from "shared/models";
import {
  franceTravailEffectifsQuerySchema,
  IFranceTravailEffectifsQuery,
} from "shared/models/routes/france-travail/franceTravail.api";
import { z } from "zod";

import { getFranceTravailEffectifsByCodeRome } from "@/common/actions/franceTravail/franceTravailEffectif.actions";
import { getRomeSecteurActivitesArborescence } from "@/common/actions/rome/rome.actions";
import { returnResult } from "@/http/middlewares/helpers";
import validateRequestMiddleware from "@/http/middlewares/validateRequestMiddleware";

export default () => {
  const router = express.Router();

  router.get("/arborescence", returnResult(getArborescence));
  router.get(
    "/effectifs/:code_secteur",
    validateRequestMiddleware({
      params: z.object({
        code_secteur: z.string().min(1).describe("Code ROME du secteur d'activité"),
      }),
      query: franceTravailEffectifsQuerySchema,
    }),
    returnResult(async (req, { locals }) => {
      const ftOrga = locals.franceTravail as IOrganisationFranceTravail;
      const { code_secteur } = req.params;
      const { page, limit, search, sort, order } = req.query as IFranceTravailEffectifsQuery;

      return getFranceTravailEffectifsByCodeRome(code_secteur, ftOrga.code_region, {
        page,
        limit,
        search,
        sort,
        order,
      });
    })
  );
  router.get("/effectif/:id", returnResult(getEffectifById));

  router.put("/effectif/:id", returnResult(updateEffectifById));

  return router;
};

const getArborescence = async (_req) => {
  return getRomeSecteurActivitesArborescence();
};

const getEffectifById = async (_req, { locals }) => {
  const _ftOrga = locals.franceTravail as IOrganisationFranceTravail;
  // WIP
};

const updateEffectifById = async (_req, { locals }) => {
  const _ftOrga = locals.franceTravail as IOrganisationFranceTravail;
  // WIP
};
