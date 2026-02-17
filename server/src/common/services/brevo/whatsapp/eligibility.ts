import { ObjectId } from "mongodb";
import { IMissionLocaleEffectif } from "shared/models/data/missionLocaleEffectif.model";
import { CONVERSATION_STATE } from "shared/models/data/whatsappContact.model";

import logger from "@/common/logger";
import config from "@/config";

import { upsertBrevoContact, sendWhatsAppTemplate } from "./brevoApi";
import { updateWhatsAppContact, getMissionLocaleInfo } from "./database";
import { maskPhone, normalizePhoneNumber, getTargetPhone } from "./phone";

/**
 * Vérifie si un effectif est éligible pour recevoir un WhatsApp
 */
export function isEligibleForWhatsApp(effectif: IMissionLocaleEffectif): boolean {
  // Pas de téléphone valide
  const phone = effectif.effectif_snapshot?.apprenant?.telephone;
  if (!phone || !normalizePhoneNumber(phone)) {
    return false;
  }

  // Déjà contacté par WhatsApp
  if (effectif.whatsapp_contact?.last_message_sent_at) {
    return false;
  }

  // A fait opt-out
  if (effectif.whatsapp_contact?.opted_out) {
    return false;
  }

  return true;
}

/**
 * Déclenche l'envoi WhatsApp si l'effectif est éligible
 * Appelé après qu'une ML marque un effectif comme CONTACTE_SANS_RETOUR
 */
export async function triggerWhatsAppIfEligible(
  effectif: IMissionLocaleEffectif | null,
  missionLocaleId: ObjectId
): Promise<void> {
  if (!effectif) {
    logger.warn({ missionLocaleId }, "triggerWhatsAppIfEligible: effectif is null");
    return;
  }

  if (!config.brevo.whatsapp?.enabled) {
    logger.debug({ effectifId: effectif._id }, "WhatsApp feature is disabled");
    return;
  }

  // Vérifier l'éligibilité
  if (!isEligibleForWhatsApp(effectif)) {
    logger.debug(
      {
        effectifId: effectif._id,
        hasPhone: !!effectif.effectif_snapshot?.apprenant?.telephone,
        alreadyContacted: !!effectif.whatsapp_contact?.last_message_sent_at,
        optedOut: !!effectif.whatsapp_contact?.opted_out,
      },
      "Effectif not eligible for WhatsApp"
    );
    return;
  }

  const missionLocaleInfo = await getMissionLocaleInfo(missionLocaleId);
  if (!missionLocaleInfo) {
    logger.error({ missionLocaleId }, "Mission Locale not found for WhatsApp");
    return;
  }

  const prenom = effectif.effectif_snapshot?.apprenant?.prenom || "";
  const phone = effectif.effectif_snapshot?.apprenant?.telephone;
  if (!phone) {
    logger.warn({ effectifId: effectif._id }, "No phone number for WhatsApp");
    return;
  }
  const targetPhone = getTargetPhone(phone);

  if (!targetPhone) {
    logger.warn({ effectifId: effectif._id }, "Invalid phone number for WhatsApp");
    return;
  }

  const templateId = config.brevo.whatsapp?.templateInjoignablesId;
  if (!templateId) {
    logger.error("WhatsApp template ID not configured (MNA_TDB_WHATSAPP_TEMPLATE_INJOIGNABLES_ID)");
    return;
  }

  // Créer/mettre à jour le contact Brevo avec les attributs du template
  await upsertBrevoContact(targetPhone, {
    TBA_EFFECTIF_PRENOM_WHATSAPP: prenom,
    TBA_EFFECTIF_MISSION_LOCALE_NOM_WHATSAPP: missionLocaleInfo.nom,
  });

  const result = await sendWhatsAppTemplate(targetPhone, {
    templateId,
  });

  // Mettre à jour l'effectif
  const now = new Date();
  await updateWhatsAppContact(
    effectif._id,
    {
      phone_normalized: targetPhone,
      last_message_sent_at: now,
      message_id: result.messageId,
      message_status: result.success ? "sent" : "failed",
      status_updated_at: now,
      conversation_state: result.success ? CONVERSATION_STATE.INITIAL_SENT : CONVERSATION_STATE.CLOSED,
    },
    {
      direction: "outbound",
      content: `[Template injoignables_recemment] prenom=${prenom}, mission_locale=${missionLocaleInfo.nom}`,
      sent_at: now,
      brevo_message_id: result.messageId,
    }
  );

  const templateVars = {
    phoneNumber: maskPhone(targetPhone),
    prenom: prenom.length > 2 ? prenom.slice(0, 2) + "***" : "***",
    missionLocale: missionLocaleInfo.nom,
    templateId,
  };

  if (result.success) {
    logger.info(
      {
        effectifId: effectif._id,
        missionLocaleId,
        messageId: result.messageId,
        templateVars,
      },
      "WhatsApp initial message sent"
    );
  } else {
    logger.error(
      {
        effectifId: effectif._id,
        missionLocaleId,
        error: result.error,
        templateVars,
      },
      "Failed to send WhatsApp initial message"
    );
  }
}
