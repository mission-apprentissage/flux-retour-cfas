import { ObjectId } from "mongodb";
import { IOrganisationMissionLocale } from "shared/models";
import {
  IConversationState,
  IUserResponseType,
  IWhatsAppMessageHistory,
} from "shared/models/data/whatsappContact.model";

import logger from "@/common/logger";
import { missionLocaleEffectifsDb, organisationsDb } from "@/common/model/collections";

import { MissionLocaleInfo } from "./types";

export async function updateWhatsAppContact(
  effectifId: ObjectId,
  update: Partial<{
    phone_normalized: string;
    brevo_visitor_id: string;
    last_message_sent_at: Date;
    message_id: string;
    message_status: string;
    status_updated_at: Date;
    conversation_state: IConversationState;
    user_response: IUserResponseType;
    user_response_at: Date;
    user_response_raw: string;
    opted_out: boolean;
    opted_out_at: Date;
    auto_reply_sent: boolean;
    auto_reply_sent_at: Date;
  }>,
  historyEntries?: IWhatsAppMessageHistory | IWhatsAppMessageHistory[]
): Promise<void> {
  const updateDoc: Record<string, any> = {};

  // Build $set operations
  for (const [key, value] of Object.entries(update)) {
    if (value !== undefined) {
      updateDoc[`whatsapp_contact.${key}`] = value;
    }
  }

  const updateOps: Record<string, any> = {
    $set: {
      ...updateDoc,
      updated_at: new Date(),
    },
  };

  if (historyEntries) {
    const entries = Array.isArray(historyEntries) ? historyEntries : [historyEntries];
    updateOps.$push = {
      "whatsapp_contact.messages_history": { $each: entries },
    };
  }

  await missionLocaleEffectifsDb().updateOne({ _id: effectifId }, updateOps);
}

/**
 * Récupère les informations de la Mission Locale
 */
export async function getMissionLocaleInfo(missionLocaleId: ObjectId): Promise<MissionLocaleInfo | null> {
  const organisation = (await organisationsDb().findOne({
    _id: missionLocaleId,
    type: "MISSION_LOCALE",
  })) as IOrganisationMissionLocale | null;

  if (!organisation) {
    return null;
  }

  return {
    nom: organisation.nom,
    telephone: organisation.telephone ?? undefined,
    site_web: organisation.site_web ?? undefined,
    adresse: organisation.adresse?.commune ?? undefined,
  };
}

/**
 * Met à jour le statut d'un message WhatsApp (webhook delivery/read)
 */
export async function updateMessageStatus(messageId: string, status: "delivered" | "read" | "failed"): Promise<void> {
  const result = await missionLocaleEffectifsDb().updateOne(
    { "whatsapp_contact.message_id": messageId },
    {
      $set: {
        "whatsapp_contact.message_status": status,
        "whatsapp_contact.status_updated_at": new Date(),
        updated_at: new Date(),
      },
    }
  );

  if (result.matchedCount === 0) {
    logger.warn({ messageId }, "No effectif found for message status update");
  } else {
    logger.debug({ messageId, status }, "WhatsApp message status updated");
  }
}
