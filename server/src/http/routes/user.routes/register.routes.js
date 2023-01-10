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
  finalizeUser,
  userHasAskAccess,
} from "../../../common/actions/users.actions.js";
import * as sessions from "../../../common/actions/sessions.actions.js";
import { createUserTokenSimple } from "../../../common/utils/jwtUtils.js";
import { responseWithCookie } from "../../../common/utils/httpUtils.js";
import { findDataFromSiret } from "../../../common/actions/infoSiret.actions.js";
import { authMiddleware } from "../../middlewares/authMiddleware.js";
import { userAfterCreate } from "../../../common/actions/users.afterCreate.actions.js";
import { fetchOrganismeWithSiret } from "../../../common/apis/apiReferentielMna.js";

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
        type: Joi.string().allow("pilot", "of", "reseau_of", "erp").required(),
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

      let uai = null;
      if (type === "of") {
        const resp = await fetchOrganismeWithSiret(siret);
        if (resp) {
          uai = resp.uai;
        } else {
          throw Boom.badRequest("Something went wrong");
        }
      }

      const user = await createUser(
        { email, password },
        {
          roles: [type],
          siret,
          nom,
          prenom,
          civility,
          ...(uai ? { uai } : {}),
        }
      );

      if (!user) {
        throw Boom.badRequest("Something went wrong");
      }

      await mailer.sendEmail({ to: user.email, payload: { ...user, tmpPwd: password } }, "activation_user");

      return res.json({ succeeded: true });
    })
  );

  router.post(
    "/siret-adresse",
    tryCatch(async ({ body }, res) => {
      const { siret, organismeFormation } = await Joi.object({
        siret: Joi.string().required(),
        organismeFormation: Joi.boolean().default(false),
      }).validateAsync(body, { abortEarly: false });

      const { result, messages } = await findDataFromSiret(siret, false);

      if (Object.keys(result).length === 0) {
        return res.json({ result, messages });
      }

      let uai = null;
      if (organismeFormation) {
        const resp = await fetchOrganismeWithSiret(siret);
        if (resp) {
          uai = resp.uai;
        }
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
          uai,
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

      const token = createUserTokenSimple({ payload });
      await sessions.addJwt(token);

      return responseWithCookie({ res, token }).status(200).json({
        succeeded: true,
        token,
      });
    })
  );

  router.post(
    "/demande-acces",
    authMiddleware(),
    tryCatch(async ({ body, user }, res) => {
      const { type } = await Joi.object({
        type: Joi.string()
          .valid("organisme.admin", "organisme.member", "organisme.readonly", "organisme.statsonly")
          .required(),
      }).validateAsync(body, { abortEarly: false });

      const userDb = await getUser(user.email.toLowerCase());
      if (!userDb) {
        throw Boom.conflict(`Unable to retrieve user`);
      }

      if (userDb.account_status !== "FORCE_COMPLETE_PROFILE_STEP1") {
        throw Boom.badRequest("Something went wrong");
      }

      await userAfterCreate({ user: userDb, mailer, asRole: type });

      const updateUser = await userHasAskAccess(userDb.email, {});
      if (!updateUser) {
        throw Boom.badRequest("Something went wrong");
      }

      const payload = await structureUser(updateUser);

      await loggedInUser(payload.email);

      const token = createUserTokenSimple({ payload });

      if (await sessions.findJwt(token)) {
        await sessions.removeJwt(token);
      }
      await sessions.addJwt(token);

      return responseWithCookie({ res, token }).status(200).json({
        loggedIn: true,
        token,
      });
    })
  );

  router.post(
    "/finalize",
    authMiddleware(),
    // eslint-disable-next-line no-unused-vars
    tryCatch(async ({ body, user }, res) => {
      // TODO [tech]
      // eslint-disable-next-line no-unused-vars
      // const { compte, siret } = await Joi.object({
      //   compte: Joi.string().required(),
      //   siret: Joi.string().required(),
      // }).validateAsync(body, { abortEarly: false });

      const userDb = await getUser(user.email.toLowerCase());
      if (!userDb) {
        throw Boom.conflict(`Unable to retrieve user`);
      }

      if (userDb.account_status !== "FORCE_COMPLETE_PROFILE_STEP2") {
        throw Boom.badRequest("Something went wrong");
      }

      // TODO [tech]
      const updateUser = await finalizeUser(userDb.email, {});
      if (!updateUser) {
        throw Boom.badRequest("Something went wrong");
      }

      const payload = await structureUser(updateUser);

      await loggedInUser(payload.email);

      const token = createUserTokenSimple({ payload });

      if (await sessions.findJwt(token)) {
        await sessions.removeJwt(token);
      }
      await sessions.addJwt(token);

      return responseWithCookie({ res, token }).status(200).json({
        loggedIn: true,
        token,
      });
    })
  );

  return router;
};
