import { captureException } from "@sentry/node";
import express from "express";
import { BREVO_TEMPLATE_NAME, BREVO_TEMPLATE_TYPE } from "shared/models/data/brevoMissionLocaleTemplate.model";
import { maskTelephone } from "shared/utils/phone";
import { z } from "zod";

import {
  confirmEffectifChoiceByTokenDbUpdate,
  deactivateEffectifToken,
  getBrevoTemplateId,
  getEffectifMailFromToken,
  getMissionLocaleEffectifInfoFromToken,
  updateEffectifPhoneNumberByTokenDbUpdate,
} from "@/common/actions/campagnes/campagnes.actions";
import { getLbaTrainingLinksWithCustomUtm } from "@/common/actions/lba/lba.actions";
import { sendTransactionalEmail } from "@/common/services/brevo/brevo";
import config from "@/config";
import validateRequestMiddleware from "@/http/middlewares/validateRequestMiddleware";

export default () => {
  const router = express.Router();

  router.get(
    "/",
    validateRequestMiddleware({
      query: z.object({
        utm_source: z.string(),
        utm_medium: z.string(),
        utm_campaign: z.string(),
      }),
    }),
    getMissionLocaleEffectifInfoByToken
  );

  router.get(
    "/confirmation/:confirmation",
    validateRequestMiddleware({ params: z.object({ confirmation: z.enum(["true", "false"]) }) }),
    confirmEffectifChoiceAndRedirect
  );
  router.post("/telephone", updateEffectifPhoneNumberByToken);

  return router;
};

async function getMissionLocaleEffectifInfoByToken(req, res, next) {
  try {
    const { utm_campaign, utm_medium, utm_source, rncp, cfd } = req.query;
    const token = res.locals.token;
    const effectif = await getMissionLocaleEffectifInfoFromToken(token);
    const lbaUrl = await getLbaTrainingLinksWithCustomUtm(cfd, rncp, {
      source: utm_source,
      medium: utm_medium,
      campaign: utm_campaign,
    });

    const maskedTelephone = maskTelephone(effectif.telephone);

    res.json({
      missionLocale: effectif.missionLocale,
      organismeNom: effectif.organismeFormateur.nom,
      telephone: maskedTelephone,
      lbaUrl,
    });
  } catch (error) {
    next(error);
  }
}

async function confirmEffectifChoiceAndRedirect(req, res, next) {
  try {
    const { token } = res.locals;
    const { confirmation } = req.params;
    const isConfirmed = confirmation === "true";

    await confirmEffectifChoiceByTokenDbUpdate(token, confirmation);
    const { courriel, ml_id } = await getEffectifMailFromToken(token);

    if (!courriel || !ml_id) {
      captureException(new Error(`Email or mission locale ID not found for token: ${token}`));
    } else {
      const templateId = await getBrevoTemplateId(
        isConfirmed ? BREVO_TEMPLATE_NAME.CONFIRMATION : BREVO_TEMPLATE_NAME.REFUS,
        BREVO_TEMPLATE_TYPE.MISSION_LOCALE,
        ml_id
      );
      if (!templateId) {
        captureException(new Error(`Template ID not found for ${isConfirmed ? "confirmation" : "refus"} email`));
      } else {
        await sendTransactionalEmail(courriel, templateId);
      }
    }

    if (!isConfirmed) {
      await deactivateEffectifToken(token);
    }

    const redirectUrl = isConfirmed
      ? `${config.publicUrl}/campagnes/mission-locale/${token}/accompagnement-valide`
      : `${config.publicUrl}/campagnes/mission-locale/accompagnement-refuse`;

    res.redirect(302, redirectUrl);
  } catch (error) {
    next(error);
  }
}

async function updateEffectifPhoneNumberByToken(req, res, next) {
  try {
    const token = res.locals.token;
    const telephone = req.body.telephone;
    await updateEffectifPhoneNumberByTokenDbUpdate(token, telephone);
    await deactivateEffectifToken(token);
    res.json({ message: "Numéro de téléphone mis à jour." });
  } catch (error) {
    next(error);
  }
}
