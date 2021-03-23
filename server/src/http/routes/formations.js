const express = require("express");
const Joi = require("joi");
const tryCatch = require("../middlewares/tryCatchMiddleware");

module.exports = ({ formations }) => {
  const router = express.Router();

  router.post(
    "/search",
    tryCatch(async (req, res) => {
      const { searchTerm } = req.body;

      const { error } = Joi.string().min(3).required().validate(searchTerm);
      if (error) {
        return res.status(400).json({ message: "'searchTerm' is required" });
      }

      const results = await formations.searchFormationByIntituleOrCfd(searchTerm);

      return res.json(results.map(({ cfd, libelle }) => ({ cfd, libelle })));
    })
  );

  return router;
};
