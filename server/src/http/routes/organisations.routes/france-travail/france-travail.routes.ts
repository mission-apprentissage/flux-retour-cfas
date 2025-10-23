import express from "express";
import { API_EFFECTIF_LISTE, IOrganisationFranceTravail } from "shared/models";
import { zFranceTravailSituationEnum } from "shared/models/data/franceTravailEffectif.model";
import {
  codeSecteurSchema,
  effectifFranceTravailQuerySchema,
  franceTravailEffectifsQuerySchema,
  IEffectifFranceTravailQuery,
  IFranceTravailEffectifsQuery,
} from "shared/models/routes/france-travail/franceTravail.api";
import { z } from "zod";

import {
  getEffectifFromFranceTravailId,
  getEffectifSecteurActivitesArboresence,
  getFranceTravailEffectifsByCodeSecteur,
  getFranceTravailEffectifsTraitesMois,
  getFranceTravailEffectifsTraitesParMois,
  updateFranceTravailData,
} from "@/common/actions/franceTravail/franceTravailEffectif.actions";
import { returnResult } from "@/http/middlewares/helpers";
import validateRequestMiddleware from "@/http/middlewares/validateRequestMiddleware";

export default () => {
  const router = express.Router();

  router.get("/arborescence", returnResult(getArborescence));
  router.get("/effectifs/traite/mois", returnResult(getEffectifsTraitesMois));
  router.get(
    "/effectifs/traite/mois/:mois",
    validateRequestMiddleware({
      params: z.object({
        mois: z.string().regex(/^\d{4}-\d{2}$/, "Invalid month format: expected YYYY-MM"),
      }),
      query: franceTravailEffectifsQuerySchema,
    }),
    returnResult(getEffectifsTraitesParMois)
  );

  router.get(
    "/effectifs/a-traiter/:code_secteur",
    validateRequestMiddleware({
      params: z.object({
        code_secteur: codeSecteurSchema,
      }),
      query: franceTravailEffectifsQuerySchema,
    }),
    returnResult(async (req, { locals }) => {
      const ftOrga = locals.franceTravail as IOrganisationFranceTravail;
      const code_secteur = Number(req.params.code_secteur);
      const { page, limit, search, sort, order } = req.query as IFranceTravailEffectifsQuery;

      return getFranceTravailEffectifsByCodeSecteur(ftOrga.code_region, API_EFFECTIF_LISTE.A_TRAITER, code_secteur, {
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

  router.put(
    "/effectif/:id",
    validateRequestMiddleware({
      params: z.object({
        id: z.string().describe("ID de l'effectif France Travail"),
      }),
      body: z.object({
        commentaire: z.string().nullable().describe("Commentaire à ajouter ou mettre à jour"),
        situation: zFranceTravailSituationEnum.describe("Situation actuelle de l'effectif"),
        code_secteur: z.number(),
      }),
    }),
    returnResult(updateEffectifById)
  );

  return router;
};

const getArborescence = async (_req, { locals }) => {
  const ftOrga = locals.franceTravail as IOrganisationFranceTravail;
  return getEffectifSecteurActivitesArboresence(ftOrga.code_region);
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

const updateEffectifById = async (req) => {
  const effectifId = req.params.id;
  const user = req.user;
  const body = req.body;

  await updateFranceTravailData(effectifId, body.commentaire, body.situation, body.code_secteur, user._id);
};

const getEffectifsTraitesMois = async (_req, { locals }) => {
  const ftOrga = locals.franceTravail as IOrganisationFranceTravail;
  return getFranceTravailEffectifsTraitesMois(ftOrga.code_region);
};

const getEffectifsTraitesParMois = async (req, { locals }) => {
  const ftOrga = locals.franceTravail as IOrganisationFranceTravail;
  const { page, limit, search, sort, order } = req.query as IFranceTravailEffectifsQuery;
  const mois = req.params.mois;

  return getFranceTravailEffectifsTraitesParMois(ftOrga.code_region, mois, {
    page,
    limit,
    search,
    sort,
    order,
  });
};
