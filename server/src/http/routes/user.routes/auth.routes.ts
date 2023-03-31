import express from "express";
import Joi from "joi";

import {
  getUserByEmail,
  authenticate,
  updateUserLastConnection,
  structureUser,
} from "../../../common/actions/users.actions.js";
import * as sessions from "../../../common/actions/sessions.actions.js";
import { createUserTokenSimple } from "../../../common/utils/jwtUtils.js";
import { responseWithCookie } from "../../../common/utils/httpUtils.js";
import { COOKIE_NAME } from "../../../common/constants/cookieName.js";
import { returnResult } from "../../middlewares/helpers.js";
import Boom from "boom";

export default () => {
  const router = express.Router();

  router.post("/login", async (req, res) => {
    const { email: emailOrUsername, password } = await Joi.object({
      email: Joi.string().required(),
      password: Joi.string().required(),
    }).validateAsync(req.body, { abortEarly: false });

    const { value: email } = Joi.string().email().validate(emailOrUsername, { abortEarly: false });

    const user = await getUserByEmail(email.toLowerCase());
    if (!user) {
      return res.status(401).json({ message: "Accès non autorisé" });
    }

    const auth = await authenticate(user.email, password);

    if (!auth) return res.status(401).json({ message: "Accès non autorisé" });

    const payload = await structureUser(user);

    await updateUserLastConnection(payload.email);

    const token = createUserTokenSimple({ payload: { email: payload.email } });

    if (await sessions.findJwt(token)) {
      await sessions.removeJwt(token);
    }
    await sessions.createSession(token);

    responseWithCookie({ res, token }).status(200).json({
      loggedIn: true,
      token,
    });
  });

  router.post(
    "/logout",
    returnResult(async (req, res) => {
      if (!req.cookies[COOKIE_NAME]) {
        throw Boom.unauthorized("invalid jwt");
      }
      await sessions.removeJwt(req.cookies[COOKIE_NAME]);
      res.clearCookie(COOKIE_NAME);
      return {
        message: "successfully logged out",
      };
    })
  );

  return router;
};
