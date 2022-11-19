import express from "express";
import Boom from "boom";
import Joi from "joi";
import tryCatch from "../../middlewares/tryCatchMiddleware.js";
import { getUser, authenticate, loggedInUser, structureUser } from "../../../common/components/usersComponent.js";
import * as sessions from "../../../common/components/sessionsComponent.js";
import { createUserTokenSimple } from "../../../common/utils/jwtUtils.js";
import { responseWithCookie } from "../../../common/utils/httpUtils.js";
import { COOKIE_NAME } from "../../../common/constants/cookieName.js";

export default () => {
  const router = express.Router();

  router.post(
    "/login",
    tryCatch(async (req, res) => {
      const { email, password } = await Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required(),
      }).validateAsync(req.body, { abortEarly: false });

      const user = await getUser(email.toLowerCase());
      if (!user) {
        return res.status(401).json({ message: "Accès non autorisé" });
      }

      if (user.orign_register !== "ORIGIN") {
        throw Boom.conflict(`Wrong connection method`, { message: `Mauvaise méthode de connexion` });
      }

      const auth = await authenticate(user.email, password);

      if (!auth) return res.status(401).json({ message: "Accès non autorisé" });

      const payload = await structureUser(user);

      await loggedInUser(payload.email);

      const token = createUserTokenSimple({ payload });

      if (await sessions.findJwt(token)) {
        await sessions.removeJwt(token);
      }
      await sessions.addJwt(token);

      responseWithCookie({ res, token }).status(200).json({
        loggedIn: true,
        token,
      });
    })
  );

  router.get(
    "/logout",
    tryCatch(async (req, res) => {
      if (req.cookies[COOKIE_NAME]) {
        await sessions.removeJwt(req.cookies[COOKIE_NAME]);
        res.clearCookie(COOKIE_NAME).status(200).json({
          loggedOut: true,
        });
      } else {
        res.status(401).json({
          error: "Invalid jwt",
        });
      }
    })
  );

  return router;
};
