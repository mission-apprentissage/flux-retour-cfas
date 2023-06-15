import Boom from "boom";
import express from "express";
import Joi from "joi";

import { login } from "@/common/actions/account.actions";
import { removeSession } from "@/common/actions/sessions.actions";
import { COOKIE_NAME } from "@/common/constants/cookieName";
import { responseWithCookie } from "@/common/utils/httpUtils";
import { validateFullObjectSchema } from "@/common/utils/validationUtils";
import { returnResult } from "@/http/middlewares/helpers";

export default () => {
  const router = express.Router();

  router.post(
    "/login",
    returnResult(async (req, res) => {
      const { email, password } = await validateFullObjectSchema(req.body, {
        email: Joi.string().email().required(),
        password: Joi.string().required(),
      });
      const sessionToken = await login(email.toLowerCase(), password);
      responseWithCookie(res, sessionToken);
    })
  );

  router.post(
    "/logout",
    returnResult(async (req, res) => {
      if (!req.cookies[COOKIE_NAME]) {
        throw Boom.unauthorized("invalid jwt");
      }
      await removeSession(req.cookies[COOKIE_NAME]);
      res.clearCookie(COOKIE_NAME);
    })
  );

  return router;
};
