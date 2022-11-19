import express from "express";
import Joi from "joi";
import tryCatch from "../../middlewares/tryCatchMiddleware.js";

export default ({ formations }) => {
  const router = express.Router();

  router.post(
    "/search",
    tryCatch(async (req, res) => {
      const body = await Joi.object({
        searchTerm: Joi.string().min(3),
        etablissement_num_region: Joi.string().allow(null, ""),
        etablissement_num_departement: Joi.string().allow(null, ""),
        etablissement_reseaux: Joi.string().allow(null, ""),
      }).validateAsync(req.body, { abortEarly: false });

      const foundFormations = await formations.searchFormations(body);

      return res.json(
        foundFormations.map(({ cfd, rncps, libelle, cfd_start_date, cfd_end_date }) => ({
          cfd,
          rncps,
          libelle,
          cfd_start_date,
          cfd_end_date,
        }))
      );
    })
  );

  router.get(
    "/:cfd",
    tryCatch(async (req, res) => {
      const foundFormation = await formations.getFormationWithCfd(req.params.cfd);

      return res.json(foundFormation);
    })
  );

  return router;
};
