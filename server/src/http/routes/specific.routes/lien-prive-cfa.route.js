import express from "express";
import Joi from "joi";
import tryCatch from "../../middlewares/tryCatchMiddleware.js";
import { cfasDb } from "../../../common/model/collections.js";

export default () => {
  const router = express.Router();

  router.get(
    "/",
    tryCatch(async ({ user, query }, res) => {
      const params = await Joi.object({
        uais: Joi.array().items(Joi.string()).allow(null),
        page: Joi.number(),
        limit: Joi.number(),
      }).validateAsync(query, { abortEarly: false });

      const uais = params.uais ?? null;
      const page = Number(params.page ?? 1);
      const limit = Number(params.limit ?? 100);
      const skip = (page - 1) * limit;

      const mongoQuery = uais
        ? { uai: { $in: uais }, erps: user.username, private_url: { $nin: [null, ""] } }
        : { erps: user.username, private_url: { $nin: [null, ""] } };

      const allData = await cfasDb().find(mongoQuery).skip(skip).limit(limit).toArray();
      const count = await cfasDb().countDocuments(mongoQuery);
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
