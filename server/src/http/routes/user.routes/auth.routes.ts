import express from "express";
import Joi from "joi";

import { responseWithCookie } from "../../../common/utils/httpUtils.js";
import { COOKIE_NAME } from "../../../common/constants/cookieName.js";
import { returnResult } from "../../middlewares/helpers.js";
import Boom from "boom";
import { validateFullObjectSchema } from "../../../common/utils/validationUtils.js";
import { login } from "../../../common/actions/account.actions.js";
import { removeJwt } from "../../../common/actions/sessions.actions.js";

export default () => {
  const router = express.Router();

  router.post(
    "/login",
    returnResult(async (req, res) => {
      const { email, password } = await validateFullObjectSchema(req.body, {
        email: Joi.string().email().required(),
        password: Joi.string().required(),
      });
      const sessionToken = await login(email, password);
      responseWithCookie(res, sessionToken);
    })
  );

  router.post(
    "/logout",
    returnResult(async (req, res) => {
      if (!req.cookies[COOKIE_NAME]) {
        throw Boom.unauthorized("invalid jwt");
      }
      await removeJwt(req.cookies[COOKIE_NAME]);
      res.clearCookie(COOKIE_NAME);
    })
  );

  return router;
};
