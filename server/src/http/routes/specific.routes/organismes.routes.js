import express from "express";
import Joi from "joi";
import tryCatch from "../../middlewares/tryCatchMiddleware.js";
import pick from "lodash.pick";
import { organismesDb } from "../../../common/model/collections.js";

export default () => {
  const router = express.Router();

  /**
   * Gets organismes paginated list
   * Consumed by Referentiel SIRET-UAI
   */
  router.post(
    "/",
    tryCatch(async (req, res) => {
      const params = await Joi.object({
        query: Joi.string(),
        page: Joi.number(),
        limit: Joi.number(),
      }).validateAsync(req.query, { abortEarly: false });

      const query = params.query ?? "{}";
      const page = Number(params.page ?? 1);
      const limit = Number(params.limit ?? 50);
      const skip = (page - 1) * limit;

      const jsonQuery = JSON.parse(query);
      const allData = await organismesDb().find(jsonQuery).skip(skip).limit(limit).toArray();
      const count = await organismesDb().countDocuments(jsonQuery);
      const omittedData = allData.map((item) =>
        pick(item, [
          "uai",
          "siret",
          "nom",
          "nature",
          "nature_validity_warning",
          "reseaux",
          "adresse",
          "metiers",
          "est_dans_le_referentiel",
          "ferme",
        ])
      );

      return res.json({
        organismes: omittedData,
        pagination: {
          page,
          resultats_par_page: limit,
          nombre_de_page: Math.ceil(count / limit) || 1,
          total: count,
        },
      });
    })
  );

  return router;
};
