import express from "express";
import { primitivesV3 } from "shared/models/parts/zodPrimitives";
import { zGetEffectifsForOrganismeApi } from "shared/models/routes/organismes/effectifs/effectifs.api";
import { withPaginationSchema } from "shared/models/routes/pagination";

import { validateFullZodObjectSchema } from "@/common/utils/validationUtils";
import { requireOrganismePermission, returnResult } from "@/http/middlewares/helpers";

import { getOrganismeEffectifs, updateOrganismeEffectifs } from "../specific.routes/organisme.routes";

export default () => {
  const router = express.Router();

  router.get(
    "/",
    requireOrganismePermission("manageEffectifs"),
    returnResult(async ({ query }, res) => {
      const queryFilters = await validateFullZodObjectSchema(query, withPaginationSchema(zGetEffectifsForOrganismeApi));

      return await getOrganismeEffectifs(res.locals.organismeId, queryFilters);
    })
  );

  router.put(
    "/",
    requireOrganismePermission("manageEffectifs"),
    returnResult(async (req, res) => {
      const updated = await validateFullZodObjectSchema(req.body, {
        "apprenant.type_cfa": primitivesV3.type_cfa.optional(),
      });
      await updateOrganismeEffectifs(res.locals.organismeId, updated);
    })
  );
  return router;
};
