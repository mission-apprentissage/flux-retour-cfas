import { ObjectId } from "mongodb";
import { CONVERSATION_STATE } from "shared/models/data/whatsappContact.model";

import logger from "@/common/logger";
import { missionLocaleEffectifsDb } from "@/common/model/collections";
import config from "@/config";

import { sendWhatsAppTemplate, upsertBrevoContact } from "./brevoApi";
import { getMissionLocaleInfo } from "./database";
import { isEligibleForWhatsApp } from "./eligibility";
import { applyTestPhoneOverride, maskPhone, normalizePhoneNumber } from "./phone";

export type InjoignablesSendResult =
  | { outcome: "sent" }
  | { outcome: "skipped"; reason: string }
  | { outcome: "retry" }
  | { outcome: "failed"; reason: string };

interface ReserveAndSendInjoignablesOptions {
  effectifId: ObjectId;
  missionLocaleId: ObjectId;
  /** 1 au premier passage. Au-delà, l'effectif doit être en `failed_send` d'un envoi « injoignables » précédent. */
  attempt?: number;
  /** Un échec sans envoi possible laisse l'effectif en `failed_send` plutôt que de le clore. */
  canRetry?: boolean;
}

/** Clôt la conversation d'un envoi « injoignables » qui ne sera pas rejoué. */
export async function abandonInjoignables(effectifId: ObjectId): Promise<void> {
  const failedAt = new Date();
  await missionLocaleEffectifsDb().updateOne(
    { _id: effectifId },
    {
      $set: {
        "whatsapp_contact.message_status": "failed",
        "whatsapp_contact.status_updated_at": failedAt,
        "whatsapp_contact.conversation_state": CONVERSATION_STATE.CLOSED,
        updated_at: failedAt,
      },
    }
  );
}

/**
 * Premier message WhatsApp « injoignables » : réserve l'effectif de façon atomique, puis envoie le template.
 * Appelé par le job `whatsapp:send-initial` et par le batch `tmp:whatsapp:send-injoignables`.
 *
 * La réservation pose `last_message_sent_at` avant l'appel Brevo : deux jobs pour le même effectif
 * (l'agent ML qui enregistre deux fois) ne peuvent pas envoyer deux messages.
 */
export async function reserveAndSendInjoignables({
  effectifId,
  missionLocaleId,
  attempt = 1,
  canRetry = false,
}: ReserveAndSendInjoignablesOptions): Promise<InjoignablesSendResult> {
  // Defense-in-depth : refuse tout envoi hors prod sans test override, indépendamment du flag
  // `enabled`. Évite qu'une mauvaise config ne provoque un envoi accidentel à de vrais effectifs.
  if (config.env !== "production" && !config.brevo.whatsapp?.testPhoneOverride) {
    logger.warn({ effectifId }, "WhatsApp send blocked: non-prod env without TEST_PHONE_OVERRIDE");
    return { outcome: "skipped", reason: "non_prod_sans_override" };
  }
  if (!config.brevo.whatsapp?.enabled) {
    logger.debug({ effectifId }, "WhatsApp feature is disabled");
    return { outcome: "skipped", reason: "desactive" };
  }
  const templateId = config.brevo.whatsapp?.templateInjoignablesId;
  if (!templateId) {
    logger.error("WhatsApp template ID not configured (MNA_TDB_WHATSAPP_TEMPLATE_INJOIGNABLES_ID)");
    return { outcome: "failed", reason: "template_non_configure" };
  }

  const effectif = await missionLocaleEffectifsDb().findOne({ _id: effectifId });
  if (!effectif || effectif.soft_deleted) {
    logger.warn({ effectifId }, "Effectif introuvable ou supprimé, message WhatsApp initial abandonné");
    return { outcome: "skipped", reason: "effectif_introuvable" };
  }

  // Une reprise concerne un effectif que nous avons nous-mêmes réservé : l'éligibilité (qui exclut
  // « déjà contacté ») ne s'applique qu'au premier passage.
  if (attempt === 1 && !isEligibleForWhatsApp(effectif)) {
    logger.debug(
      { effectifId, optedOut: !!effectif.whatsapp_contact?.opted_out },
      "Effectif not eligible for WhatsApp"
    );
    return { outcome: "skipped", reason: "non_eligible" };
  }

  const missionLocaleInfo = await getMissionLocaleInfo(missionLocaleId);
  if (!missionLocaleInfo) {
    logger.error({ missionLocaleId }, "Mission Locale not found for WhatsApp");
    return { outcome: "failed", reason: "mission_locale_introuvable" };
  }

  const prenom = effectif.effectif_snapshot?.apprenant?.prenom || "";
  const targetPhone = normalizePhoneNumber(effectif.effectif_snapshot?.apprenant?.telephone);
  if (!targetPhone) {
    logger.warn({ effectifId }, "Invalid phone number for WhatsApp");
    return { outcome: "skipped", reason: "telephone_invalide" };
  }
  // Override de test : en non-prod, redirige vers le numéro de test si défini. Le numéro effectif est
  // stocké pour que le webhook inbound retrouve l'effectif quand l'utilisateur de test répond.
  const effectivePhone = applyTestPhoneOverride(targetPhone);

  const now = new Date();
  const reserved = await missionLocaleEffectifsDb().findOneAndUpdate(
    {
      _id: effectifId,
      soft_deleted: { $ne: true },
      "whatsapp_contact.opted_out": { $ne: true },
      ...(attempt === 1
        ? { "whatsapp_contact.last_message_sent_at": { $exists: false } }
        : { "whatsapp_contact.message_status": "failed_send", "whatsapp_contact.template_type": { $exists: false } }),
    },
    {
      $set: {
        "whatsapp_contact.phone_normalized": effectivePhone,
        "whatsapp_contact.last_message_sent_at": now,
        "whatsapp_contact.message_status": "pending",
        "whatsapp_contact.status_updated_at": now,
        updated_at: now,
      },
    },
    { returnDocument: "after", includeResultMetadata: false }
  );
  if (!reserved) {
    logger.debug({ effectifId, attempt }, "Effectif déjà réservé ou désinscrit, message WhatsApp initial ignoré");
    return { outcome: "skipped", reason: "deja_reserve" };
  }

  // Créer/mettre à jour le contact Brevo avec les attributs du template
  await upsertBrevoContact(effectivePhone, {
    TBA_EFFECTIF_PRENOM_WHATSAPP: prenom,
    TBA_EFFECTIF_MISSION_LOCALE_NOM_WHATSAPP: missionLocaleInfo.nom,
  });
  const result = await sendWhatsAppTemplate(effectivePhone, { templateId });

  const logContext = {
    effectifId,
    missionLocaleId,
    phoneNumber: maskPhone(effectivePhone),
    templateId,
    attempt,
  };

  if (result.success) {
    const sentAt = new Date();
    await missionLocaleEffectifsDb().updateOne(
      { _id: effectifId },
      {
        $set: {
          "whatsapp_contact.message_id": result.messageId,
          "whatsapp_contact.message_status": "sent",
          "whatsapp_contact.status_updated_at": sentAt,
          "whatsapp_contact.conversation_state": CONVERSATION_STATE.INITIAL_SENT,
          updated_at: sentAt,
        },
        $push: {
          "whatsapp_contact.messages_history": {
            $each: [
              {
                direction: "outbound" as const,
                content: `[Template injoignables_recemment] prenom=${prenom}, mission_locale=${missionLocaleInfo.nom}`,
                sent_at: sentAt,
                brevo_message_id: result.messageId,
              },
            ],
            $slice: -50,
          },
        },
      }
    );
    logger.info({ ...logContext, messageId: result.messageId }, "WhatsApp initial message sent");
    return { outcome: "sent" };
  }

  // Brevo n'a sûrement rien traité : l'effectif reste repris par le job suivant.
  if (result.safeToRetry && canRetry) {
    await missionLocaleEffectifsDb().updateOne(
      { _id: effectifId },
      { $set: { "whatsapp_contact.message_status": "failed_send", "whatsapp_contact.status_updated_at": new Date() } }
    );
    logger.warn({ ...logContext, status: result.status }, "WhatsApp initial message à rejouer");
    return { outcome: "retry" };
  }

  await abandonInjoignables(effectifId);
  logger.error(
    { ...logContext, status: result.status, error: result.error },
    "Failed to send WhatsApp initial message"
  );
  return { outcome: "failed", reason: result.safeToRetry ? "tentatives_epuisees" : "echec_brevo" };
}
