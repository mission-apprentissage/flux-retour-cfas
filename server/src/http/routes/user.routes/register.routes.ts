import express from "express";
import Joi from "joi";
import passport from "passport";
import { Strategy, ExtractJwt } from "passport-jwt";

import config from "../../../config.js";
import { getUserByEmail, activateUser } from "../../../common/actions/users.actions.js";
import * as sessions from "../../../common/actions/sessions.actions.js";
import { responseWithCookie } from "../../../common/utils/httpUtils.js";
import { findDataFromSiret } from "../../../common/actions/infoSiret.actions.js";
import { fetchOrganismeWithSiret, fetchOrganismesWithUai } from "../../../common/apis/apiReferentielMna.js";
import { siretSchema } from "../../../common/utils/validationUtils.js";
import { algoUAI } from "../../../common/utils/uaiUtils.js";
import { returnResult } from "../../middlewares/helpers.js";

const checkActivationToken = () => {
  passport.use(
    "jwt-activation",
    new Strategy(
      {
        jwtFromRequest: ExtractJwt.fromBodyField("activationToken"),
        secretOrKey: config.auth.activation.jwtSecret,
      },
      (jwt_payload, done) => {
        return getUserByEmail(jwt_payload.sub)
          .then((user) => {
            if (!user) {
              return done(null, false);
            }
            return done(null, user);
          })
          .catch((err) => done(err));
      }
    )
  );

  return passport.authenticate("jwt-activation", { session: false, failWithError: true });
};

export default () => {
  const router = express.Router();

  // FIXME potentiellement remplacé par /api/v1/organismes/search-by-uai/siret
  router.post("/uai-siret-adresse", async ({ body }, res) => {
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
          return res.json([{ uai, siret: null, result: [], messages: { error: `L'uai ${uai} n'a pas été retrouvé` } }]);

        const organismes = organismesResp.map(({ siret, uai }) => ({ siret, uai }));
        const result: any[] = [];
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
  });

  router.post(
    "/activation",
    checkActivationToken(),
    returnResult(async (req, res) => {
      // le body a déjà été validé et l'utilisateur récupéré
      // await validateFullObjectSchema(req.body, {
      //   activationToken: Joi.string().required(),
      // });
      await activateUser(req.user.email);
      const token = await sessions.createSession(req.user.email);
      responseWithCookie({ res, token });
      return {
        token,
      };
    })
  );

  // router.post("/demande-acces", authMiddleware(), async ({ body, user }, res) => {
  //   const {
  //     type,
  //     codes_region: wantedRegions,
  //     codes_academie: wantedAcademnie,
  //     codes_departement: wantedDepartements,
  //     reseau: wantedReseau,
  //   } = await Joi.object({
  //     type: Joi.string()
  //       .valid("organisme.admin", "organisme.member", "organisme.readonly", "organisme.statsonly")
  //       .required(),
  //     codes_region: Joi.string().allow(null, ""),
  //     codes_academie: Joi.string().allow(null, ""),
  //     codes_departement: Joi.string().allow(null, ""),
  //     reseau: Joi.string().allow(null, ""),
  //   }).validateAsync(body, { abortEarly: false });

  //   const userDb = await getUserByEmail(user.email.toLowerCase());
  //   if (!userDb) {
  //     throw Boom.conflict("Unable to retrieve user");
  //   }

  //   if (
  //     !(
  //       userDb.account_status &&
  //       ["PENDING_PERMISSIONS_SETUP", "PENDING_ADMIN_VALIDATION"].includes(userDb.account_status)
  //     )
  //   ) {
  //     logger.error(
  //       `User ${userDb.email} is not in the right status to ask for access (status : ${userDb.account_status})`
  //     );
  //     throw Boom.badRequest("Something went wrong");
  //   }

  //   let codes_region = wantedRegions?.split(",") ?? null;
  //   let codes_academie = wantedAcademnie?.split(",") ?? null;
  //   let codes_departement = wantedDepartements?.split(",") ?? null;

  //   let is_cross_organismes = false;
  //   if (codes_region || codes_academie || codes_departement) {
  //     is_cross_organismes = true;
  //   }

  //   // if (!is_cross_organismes && !wantedReseau) {
  //   //   const organisme =
  //   //     (userDb.uai && (await findOrganismeByUai(userDb.uai))) ||
  //   //     (userDb.siret && (await findOrganismeBySiret(userDb.siret)));
  //   //   if (!organisme) {
  //   //     logger.error(`No organisme found for user ${userDb.email} with siret ${userDb.siret}`);
  //   //     throw Boom.badRequest("No organisme found");
  //   //   }
  //   // }

  //   const updateUser = await userHasAskAccess(userDb.email, {
  //     ...(codes_region ? { codes_region: uniq(codes_region) } : {}),
  //     ...(codes_academie ? { codes_academie } : {}),
  //     ...(codes_departement ? { codes_departement } : {}),
  //     ...(is_cross_organismes ? { is_cross_organismes } : {}),
  //     ...(wantedReseau ? { reseau: wantedReseau } : {}),
  //   });

  //   if (!updateUser) {
  //     throw Boom.badRequest("Something went wrong");
  //   }

  //   // await createUserPermissions({ user: updateUser, mailer, asRole: type });

  //   const payload = await structureUser(updateUser);

  //   await updateUserLastConnection(payload.email);

  //   const token = await sessions.createSession(payload.email);

  //   return responseWithCookie({ res, token }).status(200).json({
  //     loggedIn: true,
  //     token,
  //   });
  // });

  // router.post(
  //   "/finalize",
  //   authMiddleware(),
  //   // eslint-disable-next-line @typescript-eslint/no-unused-vars
  //   async ({ user }, res) => {
  //     // TODO [tech]
  //     // eslint-disable-next-line @typescript-eslint/no-unused-vars
  //     // const { compte, siret } = await Joi.object({
  //     //   compte: Joi.string().required(),
  //     //   siret: Joi.string().required(),
  //     // }).validateAsync(body, { abortEarly: false });

  //     const userDb = await getUserByEmail(user.email);
  //     if (!userDb) {
  //       throw Boom.conflict("Unable to retrieve user");
  //     }

  //     if (userDb.account_status !== "PENDING_ADMIN_VALIDATION") {
  //       throw Boom.badRequest("Something went wrong");
  //     }

  //     const updateUser = await finalizeUser(userDb.email);
  //     if (!updateUser) {
  //       throw Boom.badRequest("Something went wrong");
  //     }

  //     const payload = await structureUser(updateUser);

  //     await updateUserLastConnection(payload.email);

  //     const token = createUserTokenSimple({ payload: { email: payload.email } });

  //     if (await sessions.findJwt(token)) {
  //       await sessions.removeJwt(token);
  //     }
  //     await sessions.createSession(token);

  //     return responseWithCookie({ res, token }).status(200).json({
  //       loggedIn: true,
  //       token,
  //     });
  //   }
  // );

  return router;
};
