const express = require("express");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const Joi = require("joi");
const { Cfa } = require("../../common/model");
const pick = require("lodash.pick");

module.exports = () => {
  const router = express.Router();

  router.get(
    "/",
    tryCatch(async (req, res) => {
      const { uais, page, limit } = await Joi.object({
        uais: Joi.array().items(Joi.string().allow(null, "")).allow(null).default(null),
        page: Joi.number().default(1),
        limit: Joi.number().default(100),
      }).validateAsync(req.query, { abortEarly: false });

      const query = uais
        ? { uai: { $in: uais }, erps: req.user.username, private_url: { $nin: [null, ""] } }
        : { erps: req.user.username, private_url: { $nin: [null, ""] } };

      const allCfas = await Cfa.paginate(query, { page, limit });
      const cfaDataWithPrivateLink = allCfas.docs.map((item) => pick(item._doc, ["nom", "uai", "private_url"]));

      return res.json({
        cfasWithPrivateLink: cfaDataWithPrivateLink,
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
