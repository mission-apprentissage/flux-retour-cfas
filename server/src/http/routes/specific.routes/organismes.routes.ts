import express from "express";
import { pick } from "lodash-es";
import { Filter } from "mongodb";
import { z } from "zod";

import { organismesDb } from "@/common/model/collections";
import { validateFullZodObjectSchema } from "@/common/utils/validationUtils";
import { returnResult } from "@/http/middlewares/helpers";

export default () => {
  const router = express.Router();

  /**
   * Gets organismes paginated list
   * Consumed by Referentiel SIRET-UAI
   */
  router.post(
    "/",
    returnResult(async (req) => {
      const params = await validateFullZodObjectSchema(req.query, {
        query: z.string().optional(),
        page: z.coerce.number().optional(),
        limit: z.coerce.number().optional(),
      });

      const query = params.query ?? "{}";
      const page = Number(params.page ?? 1);
      const limit = Number(params.limit ?? 50);
      const skip = (page - 1) * limit;

      const jsonQuery: Filter<any> = JSON.parse(query);
      const allData = await organismesDb().find(jsonQuery).skip(skip).limit(limit).toArray();
      const count = await organismesDb().countDocuments(jsonQuery);
      const omittedData = allData.map((item) =>
        pick(item, ["uai", "siret", "nom", "nature", "reseaux", "adresse", "est_dans_le_referentiel", "ferme"])
      );

      return {
        organismes: omittedData,
        pagination: {
          page,
          resultats_par_page: limit,
          nombre_de_page: Math.ceil(count / limit) || 1,
          total: count,
        },
      };
    })
  );

  return router;
};
