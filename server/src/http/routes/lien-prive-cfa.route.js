import express from "express";
import tryCatch from "../middlewares/tryCatchMiddleware.js";
import Joi from "joi";
import validateRequestQuery from "../middlewares/validateRequestQuery.js";
import { cfasDb } from "../../common/model/collections.js";

export default () => {
  const router = express.Router();

  router.get(
    "/",
    validateRequestQuery(
      Joi.object({
        uais: Joi.array().items(Joi.string()).allow(null),
        page: Joi.number(),
        limit: Joi.number(),
      })
    ),
    tryCatch(async (req, res) => {
      const uais = req.query.uais ?? null;
      const page = Number(req.query.page ?? 1);
      const limit = Number(req.query.limit ?? 100);
      const skip = (page - 1) * limit;

      const query = uais
        ? { uai: { $in: uais }, erps: req.user.username, private_url: { $nin: [null, ""] } }
        : { erps: req.user.username, private_url: { $nin: [null, ""] } };

      const allData = await cfasDb().find(query).skip(skip).limit(limit).toArray();
      const count = await cfasDb().countDocuments(query);
      const cfaDataWithPrivateLinkFormatted = allData.map((item) => ({
        nom: item.nom,
        uai: item.uai,
        private_url: `${item.private_url}?source=ERP`,
      }));

      return res.json({
        cfasWithPrivateLink: cfaDataWithPrivateLinkFormatted,
        pagination: {
          page: page,
          resultats_par_page: limit,
          nombre_de_page: Math.ceil(count / limit) || 1,
          total: count,
        },
      });
    })
  );

  return router;
};
