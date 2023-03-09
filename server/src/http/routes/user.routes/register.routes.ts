import express from "express";
import Boom from "boom";
import Joi from "joi";
import passport from "passport";
import { Strategy, ExtractJwt } from "passport-jwt";
import config from "../../../config";
import tryCatch from "../../middlewares/tryCatchMiddleware";
import {
  getUser,
  authenticate,
  updateUserLastConnection,
  structureUser,
  activateUser,
  createUser,
  finalizeUser,
  userHasAskAccess,
} from "../../../common/actions/users.actions";
import * as sessions from "../../../common/actions/sessions.actions";
import { createUserTokenSimple } from "../../../common/utils/jwtUtils";
import { responseWithCookie } from "../../../common/utils/httpUtils";
import { findDataFromSiret } from "../../../common/actions/infoSiret.actions";
import { authMiddleware } from "../../middlewares/authMiddleware";
import { userAfterCreate } from "../../../common/actions/users.afterCreate.actions";
import { fetchOrganismeWithSiret, fetchOrganismesWithUai } from "../../../common/apis/apiReferentielMna";
import { siretSchema } from "../../../common/utils/validationUtils";
import { algoUAI } from "../../../common/utils/uaiUtils";
import logger from "../../../common/logger";
import { ORGANISMES_APPARTENANCE } from "../../../common/constants/usersConstants";
import { uniq } from "lodash-es";
import { findOrganismeBySiret, findOrganismeByUai } from "../../../common/actions/organismes/organismes.actions";

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
      const {
        type,
        email,
        password,
        siret,
        uai: userUai,
        nom,
        prenom,
        civility,
        organismes_appartenance,
      } = await Joi.object({
        type: Joi.string().valid("pilot", "of", "reseau_of").required(),
        email: Joi.string().required(),
        password: Joi.string().required(),
        siret: Joi.string().required(),
        uai: Joi.string().allow(null, ""),
        nom: Joi.string().required(),
        prenom: Joi.string().required(),
        civility: Joi.string().required(),
        organismes_appartenance: Joi.string()
          .valid(...Object.keys(ORGANISMES_APPARTENANCE))
          .required(),
      }).validateAsync(body, { abortEarly: false });

      const alreadyExists = await getUser(email.toLowerCase());
      if (alreadyExists) {
        throw Boom.conflict("email already in use", { message: "email already in use" });
      }

      let uai = null;
      if (type === "of") {
        const resp = await fetchOrganismeWithSiret(siret);
        if (resp) {
          uai = resp.uai;
        } else {
          throw Boom.badRequest("SIRET inconnu");
        }
        if (userUai !== uai) {
          // TODO FIABILISATION
          logger.error(
            `POSSIBLE FIABILISATION PAR UN UTILISATUER ${email} : uai referentiel ${uai} - uai utilisateur ${uai} - siret ${siret}`
          );
        }
        uai = userUai;
      }

      const user = await createUser(
        { email, password },
        {
          roles: [type],
          siret,
          nom,
          prenom,
          civility,
          organisation: organismes_appartenance,
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
    "/uai-siret-adresse",
    tryCatch(async ({ body }, res) => {
      const {
        uai: userUai,
        siret: userSiret,
        organismeFormation,
      } = await Joi.object({
        siret: Joi.string(),
        uai: Joi.string(),
        organismeFormation: Joi.boolean().default(false),
      }).validateAsync(body, { abortEarly: false });

      let siret = null;
      if (userSiret) {
        const { value, error: errorOnUserSiret } = siretSchema().validate(userSiret);
        if (errorOnUserSiret)
          return res.json([
            { uai: userUai, siret: null, result: [], messages: { error: `Le siret ${siret} n'est pas valide` } },
          ]);
        siret = value;
      }
      let uai = null;
      if (userUai) {
        if (!algoUAI(userUai))
          return res.json([{ uai, siret: null, result: [], messages: { error: `L'UAI ${userUai} n'est pas valide` } }]);
        uai = userUai;
      }

      const buildPublicResponse = ({ uai, siret, result, messages }) => ({
        result: {
          enseigne: result.enseigne,
          entreprise_raison_sociale: result.entreprise_raison_sociale,
          numero_voie: result.numero_voie,
          type_voie: result.type_voie,
          nom_voie: result.nom_voie,
          complement_adresse: result.complement_adresse,
          code_postal: result.code_postal,
          localite: result.localite,
          ferme: result.ferme,
          secretSiret: result.secretSiret || false,
          siret,
          uai,
        },
        messages,
      });

      if (organismeFormation) {
        if (uai) {
          const { organismes: organismesResp } = await fetchOrganismesWithUai(uai);
          if (!organismesResp.length)
            return res.json([
              { uai, siret: null, result: [], messages: { error: `L'uai ${uai} n'a pas été retrouvé` } },
            ]);

          const organismes = organismesResp.map(({ siret, uai }) => ({ siret, uai }));
          const result = [];
          for (const organisme of organismes) {
            const responseFromApiEntreprise = await findDataFromSiret(organisme.siret, false);
            result.push(
              buildPublicResponse({ uai: organisme.uai, siret: organisme.siret, ...responseFromApiEntreprise })
            );
          }
          return res.json(result);
        } else {
          const resp = await fetchOrganismeWithSiret(siret);
          if (resp) {
            uai = resp.uai;
          }
        }
      }

      const responseFromApiEntreprise = await findDataFromSiret(siret, false);
      if (Object.keys(responseFromApiEntreprise.result).length === 0) {
        return res.json([{ uai, siret, ...responseFromApiEntreprise }]);
      }

      return res.json([buildPublicResponse({ uai, siret, ...responseFromApiEntreprise })]);
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

      await updateUserLastConnection(payload.email);

      const token = createUserTokenSimple({ payload: { email: payload.email } });
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
      const {
        type,
        codes_region: wantedRegions,
        codes_academie: wantedAcademnie,
        codes_departement: wantedDepartements,
        reseau: wantedReseau,
      } = await Joi.object({
        type: Joi.string()
          .valid("organisme.admin", "organisme.member", "organisme.readonly", "organisme.statsonly")
          .required(),
        codes_region: Joi.string().allow(null, ""),
        codes_academie: Joi.string().allow(null, ""),
        codes_departement: Joi.string().allow(null, ""),
        reseau: Joi.string().allow(null, ""),
      }).validateAsync(body, { abortEarly: false });

      const userDb = await getUser(user.email.toLowerCase());
      if (!userDb) {
        throw Boom.conflict("Unable to retrieve user");
      }

      if (!["FORCE_COMPLETE_PROFILE_STEP1", "FORCE_COMPLETE_PROFILE_STEP2"].includes(userDb.account_status)) {
        logger.error(
          `User ${userDb.email} is not in the right status to ask for access (status : ${userDb.account_status})`
        );
        throw Boom.badRequest("Something went wrong");
      }

      let codes_region = wantedRegions?.split(",") ?? null;
      let codes_academie = wantedAcademnie?.split(",") ?? null;
      let codes_departement = wantedDepartements?.split(",") ?? null;

      let is_cross_organismes = null;
      if (codes_region || codes_academie || codes_departement) {
        is_cross_organismes = true;
      }

      if (!is_cross_organismes && !wantedReseau) {
        let organisme = (await findOrganismeByUai(userDb.uai)) || (await findOrganismeBySiret(userDb.siret));
        if (!organisme) {
          logger.error(`No organisme found for user ${userDb.email} with siret ${userDb.siret}`);
          throw Boom.badRequest("No organisme found");
        }
      }

      const updateUser = await userHasAskAccess(userDb.email, {
        ...(codes_region ? { codes_region: uniq(codes_region) } : {}),
        ...(codes_academie ? { codes_academie } : {}),
        ...(codes_departement ? { codes_departement } : {}),
        ...(is_cross_organismes ? { is_cross_organismes } : {}),
        ...(wantedReseau ? { reseau: wantedReseau } : {}),
      });

      if (!updateUser) {
        throw Boom.badRequest("Something went wrong");
      }

      await userAfterCreate({ user: updateUser, mailer, asRole: type });

      const payload = await structureUser(updateUser);

      await updateUserLastConnection(payload.email);

      const token = createUserTokenSimple({ payload: { email: payload.email } });

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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    tryCatch(async ({ body, user }, res) => {
      // TODO [tech]
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      // const { compte, siret } = await Joi.object({
      //   compte: Joi.string().required(),
      //   siret: Joi.string().required(),
      // }).validateAsync(body, { abortEarly: false });

      const userDb = await getUser(user.email.toLowerCase());
      if (!userDb) {
        throw Boom.conflict("Unable to retrieve user");
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

      await updateUserLastConnection(payload.email);

      const token = createUserTokenSimple({ payload: { email: payload.email } });

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
