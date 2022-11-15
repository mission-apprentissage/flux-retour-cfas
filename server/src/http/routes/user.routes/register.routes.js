import express from "express";
import Boom from "boom";
import Joi from "joi";
import passport from "passport";
import { Strategy, ExtractJwt } from "passport-jwt";
import config from "../../../config.js";
import tryCatch from "../../middlewares/tryCatchMiddleware.js";
import {
  getUser,
  authenticate,
  loggedInUser,
  structureUser,
  activateUser,
  createUser,
  getUserById,
} from "../../../common/components/usersComponent.js";
import * as sessions from "../../../common/components/sessionsComponent.js";
import { createUserToken } from "../../../common/utils/jwtUtils.js";
import { responseWithCookie } from "../../../common/utils/httpUtils.js";
import { findDataFromSiret } from "../../../common/components/infoSiretComponent.js";

const checkActivationToken = () => {
  passport.use(
    "jwt-activation",
    new Strategy(
      {
        jwtFromRequest: ExtractJwt.fromBodyField("activationToken"),
        secretOrKey: config.auth.activation.jwtSecret,
      },
      (jwt_payload, done) => {
        return getUser(jwt_payload.sub)
          .then((user) => {
            if (!user) {
              return done(null, false);
            }
            return done(null, { ...user, tmpPwd: jwt_payload.tmpPwd });
          })
          .catch((err) => done(err));
      }
    )
  );

  return passport.authenticate("jwt-activation", { session: false, failWithError: true });
};

export default ({ mailer }) => {
  const router = express.Router();

  router.post(
    "/register",
    tryCatch(async ({ body }, res) => {
      const { type, email, password, siret, nom, prenom, civility } = await Joi.object({
        type: Joi.string().allow("entreprise", "of").required(),
        email: Joi.string().required(),
        password: Joi.string().required(),
        siret: Joi.string().required(),
        nom: Joi.string().required(),
        prenom: Joi.string().required(),
        civility: Joi.string().required(),
      }).validateAsync(body, { abortEarly: false });

      const alreadyExists = await getUser(email.toLowerCase());
      if (alreadyExists) {
        throw Boom.conflict(`Unable to create`, { message: `email already in use` });
      }

      const userId = await createUser(
        { email, password },
        {
          roles: [type],
          siret,
          nom,
          prenom,
          civility,
        }
      );

      if (!userId) {
        throw Boom.badRequest("Something went wrong");
      }

      const user = await getUserById(userId);
      await mailer.sendEmail({ ...user, tmpPwd: password }, "activation_user");

      return res.json({ succeeded: true });
    })
  );

  router.post(
    "/siret-adresse",
    tryCatch(async ({ body }, res) => {
      const { siret } = await Joi.object({
        siret: Joi.string().required(),
      }).validateAsync(body, { abortEarly: false });

      const { result, messages } = await findDataFromSiret(siret, false);

      if (Object.keys(result).length === 0) {
        return res.json({ result, messages });
      }

      return res.json({
        result: {
          enseigne: result.enseigne,
          entreprise_raison_sociale: result.entreprise_raison_sociale,
          numero_voie: result.numero_voie,
          nom_voie: result.nom_voie,
          complement_adresse: result.complement_adresse,
          code_postal: result.code_postal,
          localite: result.localite,
          ferme: result.ferme,
          secretSiret: result.secretSiret || false,
        },
        messages,
      });
    })
  );

  router.post(
    "/activation",
    checkActivationToken(),
    tryCatch(async ({ body, user }, res) => {
      await Joi.object({
        activationToken: Joi.string().required(),
      }).validateAsync(body, { abortEarly: false });

      const auth = await authenticate(user.email.toLowerCase(), user.tmpPwd);

      if (!auth) {
        throw Boom.unauthorized("Accès non autorisé");
      }

      const updatedUser = await activateUser(user.email.toLowerCase());

      const payload = await structureUser(updatedUser);

      await loggedInUser(payload.email);

      const token = createUserToken({ payload });
      await sessions.addJwt(token);

      return responseWithCookie({ res, token }).status(200).json({
        succeeded: true,
        token,
      });
    })
  );

  return router;
};
