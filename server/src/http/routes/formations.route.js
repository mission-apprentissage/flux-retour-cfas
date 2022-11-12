import express from 'express';
import Joi from 'joi';
import tryCatch from '../middlewares/tryCatchMiddleware';
import validateRequestBody from '../middlewares/validateRequestBody';

export default ({ formations }) => {
  const router = express.Router();

  router.post(
    "/search",
    validateRequestBody(
      Joi.object({
        searchTerm: Joi.string().min(3),
        etablissement_num_region: Joi.string().allow(null, ""),
        etablissement_num_departement: Joi.string().allow(null, ""),
        etablissement_reseaux: Joi.string().allow(null, ""),
      })
    ),
    tryCatch(async (req, res) => {
      const foundFormations = await formations.searchFormations(req.body);

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
