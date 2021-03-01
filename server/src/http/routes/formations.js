const express = require("express");
const Joi = require("joi");
const { Formation: FormationModel } = require("../../common/model");
const tryCatch = require("../middlewares/tryCatchMiddleware");

module.exports = () => {
  const router = express.Router();

  const MAX_NUMBER_OF_SEARCH_RESULTS = 50;

  router.post(
    "/search",
    tryCatch(async (req, res) => {
      const searchTerm = req.query.searchTerm;

      const { error } = Joi.string().min(3).required().validate(searchTerm);
      if (error) {
        return res.status(400).json({ message: "query parameter 'searchTerm' is required" });
      }

      const results = await FormationModel.find({
        $or: [{ $text: { $search: searchTerm } }, { cfd: new RegExp(searchTerm, "g") }],
      }).limit(MAX_NUMBER_OF_SEARCH_RESULTS);

      return res.json(results.map(({ cfd, libelle }) => ({ cfd, libelle })));
    })
  );

  return router;
};
