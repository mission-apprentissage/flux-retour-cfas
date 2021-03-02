const express = require("express");
const Joi = require("joi");
const tryCatch = require("../middlewares/tryCatchMiddleware");

module.exports = ({ cfas }) => {
  const router = express.Router();

  router.post(
    "/search",
    tryCatch(async (req, res) => {
      const { searchTerm } = req.query;

      const { error } = Joi.string().min(3).required().validate(searchTerm);
      if (error) {
        return res.status(400).json({ message: "query parameter 'searchTerm' is required" });
      }

      try {
        const foundCfa = await cfas.searchCfasByNomEtablissement(searchTerm);
        return res.json(foundCfa);
      } catch (err) {
        return res.json(null);
      }
    })
  );

  return router;
};
