import express from "express";
import { IOrganisationOperateurPublicRegion } from "shared/models";
import { z } from "zod";

//import parentLogger from "@/common/logger";
import { getAffelnetCountVoeuxNational } from "@/common/actions/affelnet.actions";
import { AuthContext } from "@/common/model/internal/AuthContext";
import { requireOrganismeRegional, returnResult } from "@/http/middlewares/helpers";
import validateRequestMiddleware from "@/http/middlewares/validateRequestMiddleware";

// const logger = parentLogger.child({
//   module: "affelnet-route",
// });

export default () => {
  const router = express.Router();

  // TODO : implement role
  router.get(
    "/national/count",
    requireOrganismeRegional,
    validateRequestMiddleware({
      query: z.object({
        organisme_departements: z.preprocess((str: any) => str.split(","), z.array(z.string())).optional(),
      }),
    }),
    returnResult(getNationalCount)
  );

  return router;
};

const getNationalCount = async (req) => {
  const user = req.user as AuthContext;
  const orga = user.organisation as IOrganisationOperateurPublicRegion;
  const organismes_regions = orga.code_region ? [orga.code_region] : [];
  const { organisme_departements } = req.query;
  return await getAffelnetCountVoeuxNational(organisme_departements, organismes_regions);
};
