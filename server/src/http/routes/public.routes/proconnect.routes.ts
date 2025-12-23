import Boom from "boom";
import { ObjectId } from "bson";
import express from "express";
import { z } from "zod";

import { getTokenProConnect, loginProConnect, logoutProConnect } from "@/common/actions/proconnect.actions";
import { createSession, removeSession } from "@/common/actions/sessions.actions";
import { createUserProConnect, getUserByEmail } from "@/common/actions/users.actions";
import { COOKIE_NAME } from "@/common/constants/cookieName";
import { proconnectSessionsDb, usersMigrationDb } from "@/common/model/collections";
import { responseWithCookie } from "@/common/utils/httpUtils";
import { registrationProConnectSchema } from "@/common/validation/registrationSchemaProConnect";
import config from "@/config";
import { authMiddleware } from "@/http/helpers/passport-handlers";
import { requireMissionLocale, returnResult } from "@/http/middlewares/helpers";
import validateRequestMiddleware from "@/http/middlewares/validateRequestMiddleware";

export default () => {
  const router = express.Router();

  router.get("/login", returnResult(login));
  router.get(
    "/callback",
    validateRequestMiddleware({
      query: z.object({
        code: z.string(),
        state: z.string(),
      }),
    }),
    returnResult(callback)
  );
  router.post(
    "/register",
    authMiddleware(),
    requireMissionLocale,
    validateRequestMiddleware({
      body: registrationProConnectSchema.user,
    }),
    returnResult(register)
  );

  router.get("/logout", authMiddleware(), returnResult(logout));
  router.get("/logout/callback", returnResult(logoutCallback));
  return router;
};

const login = async (req, res) => {
  const { url, tx } = loginProConnect();
  res.cookie("oidc_tx", JSON.stringify(tx), {
    httpOnly: true,
    sameSite: "lax",
    secure: false, // true en HTTPS
    maxAge: 5 * 60 * 1000, // 5 minutes
    path: "/api/v1/auth/proconnect",
  });
  return res.redirect(url);
};

const callback = async (req, res) => {
  const { code, state } = req.query;

  const tx = JSON.parse(req.cookies.oidc_tx);
  if (state !== tx.state) {
    return res.status(401).send("Invalid state"); // TODO error hanfdling
  }

  const { email, access_token, expires_in, id_token, refresh_token } = await getTokenProConnect(code);

  const user = await getUserByEmail(email);

  if (user && user.auth_method !== "proconnect") {
    // Désactivation du login par password
    await usersMigrationDb().updateOne(
      { _id: user._id },
      { $set: { auth_method: "proconnect" }, $unset: { password_hash: "" } }
    );

    // TODO Désactiver l'ancien jwt ?
  }

  await proconnectSessionsDb().insertOne({
    _id: new ObjectId(),
    email: email,
    access_token: access_token,
    refresh_token: refresh_token,
    expires_at: new Date(Date.now() + expires_in * 1000),
    id_token,
  });

  const sessionToken = await createSession(email, {}, "proconnect");

  res.clearCookie("oidc_tx", { path: "/api/v1/auth/proconnect" });
  responseWithCookie(res, sessionToken);
  return res.redirect(`${config.publicUrl}/`);
};

const register = async (req, res) => {
  const user = req.user;
  const organisation = res.locals.missionLocale;

  try {
    if (user.account_status !== "PENDING_PROFILE_COMPLETION") {
      throw Boom.forbidden("Le profil utilisateur est déjà complété");
    }

    const alreadyExists = await getUserByEmail(req.user.email);
    if (alreadyExists) {
      throw Boom.conflict("Profil déja existant avec cet email");
    }

    await createUserProConnect(
      {
        email: user.email,
        civility: req.body.civility,
        nom: req.body.nom,
        prenom: req.body.prenom,
        fonction: req.body.fonction,
        telephone: req.body.telephone,
        has_accept_cgu_version: req.body.has_accept_cgu_version,
      },
      organisation._id
    );

    return { account_status: "CONFIRMED" };
  } catch (err) {
    console.error("Error during ProConnect registration:", err);
    throw err;
  }
};

const logout = async (req, res) => {
  const { url, state, email } = await logoutProConnect(req.user.email);
  res.cookie("oidc_end", JSON.stringify({ state, email }), {
    httpOnly: true,
    sameSite: "lax",
    secure: false, // true en HTTPS
    maxAge: 5 * 60 * 1000, // 5 minutes
    path: "/api/v1/auth/proconnect",
  });
  return res.redirect(url);
};

const logoutCallback = async (req, res) => {
  const end = JSON.parse(req.cookies.oidc_end);
  if (req.query.state !== end.state) {
    return res.status(401).send("Invalid state"); // TODO error hanfdling
  }
  await proconnectSessionsDb().deleteOne({ email: end.email });
  res.clearCookie("oidc_end", { path: "/api/v1/auth/proconnect" });
  removeSession(req.cookies[COOKIE_NAME]);
  res.clearCookie(COOKIE_NAME);
  return res.redirect(`${config.publicUrl}/`);
};
