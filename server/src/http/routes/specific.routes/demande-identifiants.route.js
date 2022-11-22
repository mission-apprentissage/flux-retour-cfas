import express from "express";
import Joi from "joi";
import tryCatch from "../../middlewares/tryCatchMiddleware.js";

export default ({ demandeIdentifiants }) => {
  const router = express.Router();

  router.post(
    "/",
    tryCatch(async (req, res) => {
      const body = await Joi.object({
        region: Joi.string().required(),
        profil: Joi.string().required(),
        email: Joi.string().required(),
      }).validateAsync(req.body, { abortEarly: false });

      await demandeIdentifiants.create(body);
      return res.json({});
    })
  );

  return router;
};
