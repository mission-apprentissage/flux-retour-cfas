import express from "express";
import tryCatch from "../../middlewares/tryCatchMiddleware.js";
import Joi from "joi";
import Boom from "boom";
import { getUser, structureUser, updateUser } from "../../../common/actions/users.actions.js";

export default () => {
  const router = express.Router();

  router.put(
    "/user",
    tryCatch(async ({ body, user }, res) => {
      const { nom, prenom, email, telephone, civility } = await Joi.object({
        prenom: Joi.string().default("").allow(""),
        nom: Joi.string().default("").allow(""),
        email: Joi.string().required().allow(""),
        telephone: Joi.string().default("").allow(""),
        civility: Joi.string().default("").allow(""),
      }).validateAsync(body, { abortEarly: false });

      if (user.email !== email) {
        throw Boom.badRequest("Accès non autorisé");
      }

      const userDb = await getUser(user.email);
      if (!userDb) {
        throw Boom.badRequest("Something went wrong");
      }

      await updateUser(userDb._id, {
        prenom: prenom ?? user.prenom,
        nom: nom ?? user.nom,
        ...(civility ? { civility } : {}),
        telephone: telephone ?? user.telephone,
      });

      res.json({ message: "Profile updated" });
    })
  );

  router.put(
    "/acceptCgu",
    tryCatch(async ({ body, user }, res) => {
      const { has_accept_cgu_version } = await Joi.object({
        has_accept_cgu_version: Joi.string().required(),
      }).validateAsync(body, { abortEarly: false });

      const userDb = await getUser(user.email);
      if (!userDb) {
        throw Boom.badRequest("Something went wrong");
      }

      const updatedUser = await updateUser(userDb._id, {
        has_accept_cgu_version,
      });

      const payload = await structureUser(updatedUser);

      return res.json(payload);
    })
  );

  return router;
};
