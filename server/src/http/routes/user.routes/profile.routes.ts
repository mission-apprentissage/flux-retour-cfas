import express from "express";
import Joi from "joi";

import { structureUser, updateUser } from "../../../common/actions/users.actions.js";
import { stripEmptyFields, validateFullObjectSchema } from "../../../common/utils/validationUtils.js";
import { returnResult } from "../../middlewares/helpers.js";

export default () => {
  const router = express.Router();

  router.put(
    "/user",
    returnResult(async (req) => {
      const { nom, prenom, telephone, civility } = await validateFullObjectSchema(req.body, {
        prenom: Joi.string().default("").allow(""),
        nom: Joi.string().default("").allow(""),
        telephone: Joi.string().default("").allow(""),
        civility: Joi.string().default("").allow(""),
      });
      await updateUser(
        req.user._id,
        stripEmptyFields({
          prenom,
          nom,
          civility,
          telephone,
        })
      );
      return { message: "Profile updated" };
    })
  );

  router.put(
    "/acceptCgu",
    returnResult(async (req) => {
      const { has_accept_cgu_version } = await validateFullObjectSchema(req.body, {
        has_accept_cgu_version: Joi.string().required(),
      });
      const updatedUser = await updateUser(req.user._id, {
        has_accept_cgu_version,
      });
      return await structureUser(updatedUser);
    })
  );

  return router;
};
