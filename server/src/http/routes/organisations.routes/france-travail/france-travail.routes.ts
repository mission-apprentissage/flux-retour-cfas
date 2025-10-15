import express from "express";
import { IOrganisationFranceTravail } from "shared/models";

import { getRomeSecteurActivitesArborescence } from "@/common/actions/rome/rome.actions";
import { returnResult } from "@/http/middlewares/helpers";

export default () => {
  const router = express.Router();

  router.get("/arborescence", returnResult(getArborescence));
  router.get("/effectifs/:code_secteur", returnResult(getEffectifsByRome));
  router.get("/effectif/:id", returnResult(getEffectifById));

  router.put("/effectif/:id", returnResult(updateEffectifById));

  return router;
};

const getArborescence = async (_req) => {
  return getRomeSecteurActivitesArborescence();
};

const getEffectifsByRome = async (_req, { locals }) => {
  const _ftOrga = locals.franceTravail as IOrganisationFranceTravail;
  // WIP
};

const getEffectifById = async (_req, { locals }) => {
  const _ftOrga = locals.franceTravail as IOrganisationFranceTravail;
  // WIP
};

const updateEffectifById = async (_req, { locals }) => {
  const _ftOrga = locals.franceTravail as IOrganisationFranceTravail;
  // WIP
};
