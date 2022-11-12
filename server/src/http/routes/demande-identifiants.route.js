import express from 'express';
import Joi from 'joi';
import tryCatch from '../middlewares/tryCatchMiddleware';
import validateRequestBody from '../middlewares/validateRequestBody';

export default ({ demandeIdentifiants }) => {
  const router = express.Router();

  router.post(
    "/",
    validateRequestBody(
      Joi.object({
        region: Joi.string().required(),
        profil: Joi.string().required(),
        email: Joi.string().required(),
      })
    ),
    tryCatch(async (req, res) => {
      await demandeIdentifiants.create(req.body);
      return res.json({});
    })
  );

  return router;
};
