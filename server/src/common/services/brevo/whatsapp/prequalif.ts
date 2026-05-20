import { captureException } from "@sentry/node";
import { ObjectId } from "mongodb";
import { CONVERSATION_STATE } from "shared/models/data/whatsappContact.model";

import logger from "@/common/logger";
import { missionLocaleEffectifsDb } from "@/common/model/collections";
import config from "@/config";

import { sendWhatsAppTemplate, upsertBrevoContact } from "./brevoApi";
import { maskPhone } from "./phone";

export type PrequalifSentVia = "backfill" | "daily";

export type ReserveResult = "sent" | "skipped" | "failed";

const RETRY_FAILED_AFTER_MS = 60 * 60 * 1000;

interface ReserveAndSendOptions {
  effectifId: ObjectId;
  targetPhone: string;
  prenom: string;
  mlNom: string;
  sentVia: PrequalifSentVia;
}

export async function isPhoneAlreadyContacted(targetPhone: string, currentEffectifId: ObjectId): Promise<boolean> {
  const existing = await missionLocaleEffectifsDb().findOne(
    {
      _id: { $ne: currentEffectifId },
      "whatsapp_contact.phone_normalized": targetPhone,
      "whatsapp_contact.last_message_sent_at": { $exists: true },
    },
    { projection: { _id: 1 } }
  );
  return !!existing;
}

export async function reserveAndSendPrequalif({
  effectifId,
  targetPhone,
  prenom,
  mlNom,
  sentVia,
}: ReserveAndSendOptions): Promise<ReserveResult> {
  if (!config.brevo.whatsapp?.enabled) {
    logger.debug({ effectifId }, "WhatsApp disabled, skip prequalif send");
    return "skipped";
  }

  const templateId = config.brevo.whatsapp?.templatePrequalifInitialId;
  if (!templateId) {
    logger.error("WhatsApp prequalif template ID not configured (MNA_TDB_WHATSAPP_TEMPLATE_PREQUALIF_INITIAL_ID)");
    return "failed";
  }

  if (await isPhoneAlreadyContacted(targetPhone, effectifId)) {
    logger.info({ effectifId, phone: maskPhone(targetPhone) }, "Phone already contacted on another effectif, skip");
    return "skipped";
  }

  const failedRetryThreshold = new Date(Date.now() - RETRY_FAILED_AFTER_MS);
  const now = new Date();

  const reserved = await missionLocaleEffectifsDb().findOneAndUpdate(
    {
      _id: effectifId,
      soft_deleted: { $ne: true },
      $or: [
        // Cas A : jamais contacté
        { whatsapp_contact: { $exists: false } },
        { "whatsapp_contact.last_message_sent_at": { $exists: false } },
        // Cas B : retry d'un échec Brevo après cooldown 1h (fix bug 2 plan §7.7)
        {
          "whatsapp_contact.message_status": "failed_send",
          "whatsapp_contact.status_updated_at": { $lt: failedRetryThreshold },
        },
      ],
    },
    {
      $set: {
        "whatsapp_contact.phone_normalized": targetPhone,
        "whatsapp_contact.last_message_sent_at": now,
        "whatsapp_contact.template_type": "prequalif",
        "whatsapp_contact.sent_via": sentVia,
        "whatsapp_contact.message_status": "pending",
        "whatsapp_contact.conversation_state": CONVERSATION_STATE.INITIAL_SENT,
        updated_at: now,
      },
    },
    { returnDocument: "after", includeResultMetadata: false }
  );

  if (!reserved) {
    logger.debug({ effectifId }, "Effectif already reserved by another process, skip");
    return "skipped";
  }

  try {
    await upsertBrevoContact(targetPhone, {
      TBA_EFFECTIF_PRENOM_WHATSAPP: prenom,
      TBA_EFFECTIF_MISSION_LOCALE_NOM_WHATSAPP: mlNom,
    });

    const result = await sendWhatsAppTemplate(targetPhone, { templateId });

    await missionLocaleEffectifsDb().updateOne(
      { _id: effectifId },
      {
        $set: {
          "whatsapp_contact.message_id": result.messageId,
          "whatsapp_contact.message_status": result.success ? "sent" : "failed",
          "whatsapp_contact.status_updated_at": new Date(),
        },
      }
    );

    if (result.success) {
      logger.info(
        { effectifId, phone: maskPhone(targetPhone), templateId, sentVia, messageId: result.messageId },
        "WhatsApp prequalif sent"
      );
      return "sent";
    }
    logger.error({ effectifId, error: result.error }, "Brevo returned failure for prequalif send");
    return "failed";
  } catch (err) {
    await missionLocaleEffectifsDb().updateOne(
      { _id: effectifId },
      {
        $set: {
          "whatsapp_contact.message_status": "failed_send",
          "whatsapp_contact.status_updated_at": new Date(),
        },
      }
    );
    logger.error({ err, effectifId }, "Brevo send threw after reservation, marked as failed_send");
    captureException(err, {
      tags: { feature: "whatsapp_prequalif", step: "send_initial" },
      extra: { effectifId: effectifId.toString() },
    });
    return "failed";
  }
}
