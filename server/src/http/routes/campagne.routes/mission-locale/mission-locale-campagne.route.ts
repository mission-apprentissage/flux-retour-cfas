import express from "express";
import { z } from "zod";

import {
  confirmEffectifChoiceByTokenDbUpdate,
  deactivateEffectifToken,
  getMissionLocaleEffectifInfoFromToken,
  updateEffectifPhoneNumberByTokenDbUpdate,
} from "@/common/actions/campagnes/campagnes.actions";
import { getLbaTrainingLinks } from "@/common/apis/lba/lba.api";
import { maskTelephone } from "@/common/utils/phoneUtils";
import config from "@/config";
import validateRequestMiddleware from "@/http/middlewares/validateRequestMiddleware";

export default () => {
  const router = express.Router();

  router.get("/", getMissionLocaleEffectifInfoByToken);
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
    const token = res.locals.token;
    const effectif = await getMissionLocaleEffectifInfoFromToken(token);
    const lbaResponse = await getLbaTrainingLinks(effectif.formation.cfd, effectif.formation.rncp);

    let lbaUrl = null;
    if (lbaResponse && lbaResponse.data && lbaResponse.data.length) {
      lbaUrl = lbaResponse.data[0].lien_lba;
    }

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
