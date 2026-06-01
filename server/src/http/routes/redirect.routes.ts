import express from "express";
import { RateLimiterMemory } from "rate-limiter-flexible";

import logger from "@/common/logger";
import { missionLocaleEffectifsDb, organisationsDb } from "@/common/model/collections";

const TOKEN_TTL_MS = 90 * 24 * 60 * 60 * 1000;
const RDV_CLICKS_CAP = 100;
// Fallback quand token inconnu / TTL dépassé / ML sans rdv_url.
const FALLBACK_ML_URL = "https://www.unml.info/";

const redirectRateLimiter = new RateLimiterMemory({
  points: 30,
  duration: 60,
  keyPrefix: "rdv_redirect",
});

async function rateLimitMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    await redirectRateLimiter.consume(req.params.token ?? "no_token");
    next();
  } catch {
    logger.warn({ token: req.params.token }, "RDV redirect rate limited (per-token)");
    res.status(429).send("Too Many Requests");
  }
}

export default () => {
  const router = express.Router();

  /**
   * Redirection opaque pour les liens RDV envoyés via WhatsApp préqualif.
   *
   * Le lien envoyé au jeune ne pointe pas vers l'URL RDV de la ML directement : il passe
   * par cet endpoint qui (1) log le clic et (2) redirige en 302 vers l'URL réelle.
   */
  router.get("/:token", rateLimitMiddleware, async (req, res) => {
    const { token } = req.params;

    res.setHeader("Referrer-Policy", "no-referrer");

    const effectif = await missionLocaleEffectifsDb().findOne(
      {
        "whatsapp_contact.rdv_redirect_token": token,
        soft_deleted: { $ne: true },
      },
      { projection: { _id: 1, mission_locale_id: 1, whatsapp_contact: 1 } }
    );

    if (!effectif) {
      return res.redirect(302, FALLBACK_ML_URL);
    }

    const createdAt = effectif.whatsapp_contact?.rdv_redirect_token_created_at;
    if (createdAt && Date.now() - new Date(createdAt).getTime() > TOKEN_TTL_MS) {
      logger.info({ token, effectifId: effectif._id }, "RDV token expired (> 90 days), fallback redirect");
      return res.redirect(302, FALLBACK_ML_URL);
    }

    const orga = await organisationsDb().findOne(
      { _id: effectif.mission_locale_id, type: "MISSION_LOCALE" },
      { projection: { rdv_url: 1 } }
    );

    const rdvUrl = (orga as { rdv_url?: string } | null)?.rdv_url;
    const target = rdvUrl || FALLBACK_ML_URL;

    missionLocaleEffectifsDb()
      .updateOne(
        { _id: effectif._id },
        {
          $push: {
            "whatsapp_contact.rdv_clicks": {
              $each: [
                {
                  clicked_at: new Date(),
                  redirect_url: rdvUrl ?? null,
                },
              ],
              $slice: -RDV_CLICKS_CAP,
            },
          },
        }
      )
      .catch((err) => logger.error({ err, token }, "Failed to log rdv click"));

    return res.redirect(302, target);
  });

  return router;
};
