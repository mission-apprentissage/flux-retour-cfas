const express = require("express");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const Joi = require("joi");
const { CfaModel } = require("../../common/model");
const validateRequestQuery = require("../middlewares/validateRequestQuery");

module.exports = () => {
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

      const query = uais
        ? { uai: { $in: uais }, erps: req.user.username, private_url: { $nin: [null, ""] } }
        : { erps: req.user.username, private_url: { $nin: [null, ""] } };

      const allCfas = await CfaModel.paginate(query, { page, limit });
      const cfaDataWithPrivateLinkFormatted = allCfas.docs.map((item) => ({
        nom: item._doc.nom,
        uai: item._doc.uai,
        private_url: `${item._doc.private_url}?source=ERP`,
      }));

      return res.json({
        cfasWithPrivateLink: cfaDataWithPrivateLinkFormatted,
        pagination: {
          page: allCfas.page,
          resultats_par_page: limit,
          nombre_de_page: allCfas.pages,
          total: allCfas.total,
        },
      });
    })
  );

  return router;
};
