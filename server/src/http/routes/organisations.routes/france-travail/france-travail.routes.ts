import express from "express";
import { IOrganisationFranceTravail } from "shared/models";
import {
  codeRomeSchema,
  effectifFranceTravailQuerySchema,
  franceTravailEffectifsQuerySchema,
  IEffectifFranceTravailQuery,
  IFranceTravailEffectifsQuery,
} from "shared/models/routes/france-travail/franceTravail.api";
import { z } from "zod";

import {
  getEffectifFromFranceTravailId,
  getFranceTravailEffectifsByCodeRome,
} from "@/common/actions/franceTravail/franceTravailEffectif.actions";
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
        code_secteur: codeRomeSchema,
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
  router.get(
    "/effectif/:id",
    validateRequestMiddleware({
      params: z.object({
        id: z.string().min(1),
      }),
      query: effectifFranceTravailQuerySchema,
    }),
    returnResult(getEffectifById)
  );

  router.put("/effectif/:id", returnResult(updateEffectifById));

  return router;
};

const getArborescence = async (_req) => {
  return getRomeSecteurActivitesArborescence();
};

const getEffectifById = async (req, { locals }) => {
  const ftOrga = locals.franceTravail as IOrganisationFranceTravail;
  const { nom_liste, code_secteur, search, sort, order } = req.query as IEffectifFranceTravailQuery;
  const effectifId = req.params.id;

  return await getEffectifFromFranceTravailId(ftOrga.code_region, code_secteur, effectifId, nom_liste, {
    search,
    sort,
    order,
  });
};

const updateEffectifById = async (_req, { locals }) => {
  const _ftOrga = locals.franceTravail as IOrganisationFranceTravail;
  // WIP
};
