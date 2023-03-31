import express from "express";
import Joi from "joi";
import passport from "passport";
import { Strategy, ExtractJwt } from "passport-jwt";

import config from "../../../config.js";
import { getUserByEmail, activateUser } from "../../../common/actions/users.actions.js";
import { findDataFromSiret } from "../../../common/actions/infoSiret.actions.js";
import { fetchOrganismeWithSiret, fetchOrganismesWithUai } from "../../../common/apis/apiReferentielMna.js";
import { siretSchema } from "../../../common/utils/validationUtils.js";
import { algoUAI } from "../../../common/utils/uaiUtils.js";
import { returnResult } from "../../middlewares/helpers.js";
import { usersMigrationDb } from "../../../common/model/collections.js";

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
    returnResult(async (req) => {
      // le body a déjà été validé et l'utilisateur récupéré + session
      // await validateFullObjectSchema(req.body, {
      //   activationToken: Joi.string().required(),
      // });

      // cette route va permettre de retrouver l'utilisateur en fonction d'un token sans utiliser de jwt
      // car il n'y aura qu'un session cookie à terme

      // tant que l'utilisateur n'est pas confirmé
      if (req.user.account_status === "PENDING_EMAIL_VALIDATION") {
        await activateUser(req.user.email);
      }
      return await usersMigrationDb().findOne(
        { email: req.user.email },
        {
          projection: {
            _id: 0,
            account_status: 1,
          },
        }
      );
      // const token = await sessions.createSession(req.user.email);
      // responseWithCookie({ res, token });
      // return {
      //   token,
      // };
    })
  );

  return router;
};
