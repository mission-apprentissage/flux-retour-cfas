import { ObjectId } from "mongodb";
import { IMissionLocaleEffectif, SITUATION_ENUM } from "shared/models/data/missionLocaleEffectif.model";
import {
  IConversationState,
  IUserResponseType,
  IWhatsAppMessageHistory,
  CONVERSATION_STATE,
  USER_RESPONSE_TYPE,
} from "shared/models/data/whatsappContact.model";

import logger from "@/common/logger";
import { missionLocaleEffectifsDb, missionLocaleEffectifsLogDb } from "@/common/model/collections";

import { sendWhatsAppMessage } from "./brevoApi";
import { updateWhatsAppContact, getMissionLocaleInfo, markEffectifAsCallbackRequested } from "./database";
import {
  buildCallbackMessage,
  buildNoHelpMessage,
  buildStopConfirmationMessage,
  isStopMessage,
  parseUserResponse,
} from "./messages";
import { notifyMLUserOnCallback, notifyMLUserOnNoHelp } from "./notifications";
import { maskPhone, normalizePhoneNumber } from "./phone";

/**
 * Gère un message STOP : opt-out RGPD
 */
async function handleStopMessage(
  effectif: IMissionLocaleEffectif,
  text: string,
  resolvedVisitorId: string,
  inboundHistory: IWhatsAppMessageHistory
): Promise<void> {
  const now = new Date();
  const stopMessage = buildStopConfirmationMessage();
  const result = await sendWhatsAppMessage(resolvedVisitorId, stopMessage);

  const historyEntries: IWhatsAppMessageHistory[] = [inboundHistory];
  if (result.success) {
    historyEntries.push({
      direction: "outbound",
      content: stopMessage,
      sent_at: new Date(),
      brevo_message_id: result.messageId,
    });
  }

  await updateWhatsAppContact(
    effectif._id,
    {
      opted_out: true,
      opted_out_at: now,
      conversation_state: CONVERSATION_STATE.CLOSED,
      user_response_raw: text,
      message_status: "read",
      status_updated_at: now,
    },
    historyEntries
  );

  await missionLocaleEffectifsDb().updateOne(
    { _id: effectif._id },
    { $set: { a_traiter: false, injoignable: false, updated_at: new Date() } }
  );

  logger.info({ effectifId: effectif._id }, "User opted out via STOP");
}

/**
 * Traite les side effects d'une réponse callback (rappel souhaité)
 */
async function handleCallbackSideEffects(effectif: IMissionLocaleEffectif): Promise<void> {
  const alreadyRequested = effectif.whatsapp_contact?.conversation_state === CONVERSATION_STATE.CALLBACK_REQUESTED;
  await markEffectifAsCallbackRequested(effectif._id);
  if (!alreadyRequested) {
    await notifyMLUserOnCallback(effectif);
  }
}

/**
 * Traite les side effects d'une réponse no_help (pas d'aide souhaitée)
 */
async function handleNoHelpSideEffects(effectif: IMissionLocaleEffectif): Promise<void> {
  await missionLocaleEffectifsDb().updateOne(
    { _id: effectif._id },
    {
      $set: {
        a_traiter: false,
        injoignable: false,
        situation: SITUATION_ENUM.NE_SOUHAITE_PAS_ETRE_RECONTACTE,
        whatsapp_no_help_responded: true,
        whatsapp_no_help_responded_at: new Date(),
        updated_at: new Date(),
      },
    }
  );

  await missionLocaleEffectifsLogDb().insertOne({
    _id: new ObjectId(),
    mission_locale_effectif_id: effectif._id,
    situation: SITUATION_ENUM.NE_SOUHAITE_PAS_ETRE_RECONTACTE,
    created_at: new Date(),
    created_by: null,
    read_by: [],
  });

  await notifyMLUserOnNoHelp(effectif);
}

/**
 * Envoie une réponse WhatsApp et met à jour le contact avec l'historique
 */
async function sendResponseAndUpdateContact(
  effectif: IMissionLocaleEffectif,
  resolvedVisitorId: string,
  responseMessage: string,
  responseType: IUserResponseType,
  newState: IConversationState,
  text: string,
  inboundHistory: IWhatsAppMessageHistory
): Promise<void> {
  const now = new Date();
  const result = await sendWhatsAppMessage(resolvedVisitorId, responseMessage);

  const historyEntries: IWhatsAppMessageHistory[] = [inboundHistory];
  if (result.success) {
    historyEntries.push({
      direction: "outbound",
      content: responseMessage,
      sent_at: new Date(),
      brevo_message_id: result.messageId,
    });
  }

  await updateWhatsAppContact(
    effectif._id,
    {
      user_response: responseType,
      user_response_at: now,
      user_response_raw: text,
      conversation_state: newState,
      message_status: "read",
      status_updated_at: now,
    },
    historyEntries
  );
}

/**
 * Gère une réponse entrante WhatsApp
 */
export async function handleInboundWhatsAppMessage(
  phoneNumber: string,
  text: string,
  brevoMessageId?: string,
  visitorId?: string
): Promise<void> {
  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  if (!normalizedPhone) {
    logger.warn("Invalid inbound phone number");
    return;
  }

  const setFields: Record<string, any> = { updated_at: new Date() };
  if (visitorId) {
    setFields["whatsapp_contact.brevo_visitor_id"] = visitorId;
  }

  const effectif = await missionLocaleEffectifsDb().findOneAndUpdate(
    {
      "whatsapp_contact.phone_normalized": normalizedPhone,
      "whatsapp_contact.opted_out": { $ne: true },
      ...(brevoMessageId ? { "whatsapp_contact.messages_history.brevo_message_id": { $ne: brevoMessageId } } : {}),
    },
    { $set: setFields },
    { sort: { "whatsapp_contact.last_message_sent_at": -1 }, returnDocument: "after", includeResultMetadata: false }
  );

  if (!effectif) {
    logger.debug(
      { phoneNumber: maskPhone(normalizedPhone), brevoMessageId },
      "No effectif found or message already processed"
    );
    return;
  }

  const resolvedVisitorId = visitorId || effectif.whatsapp_contact?.brevo_visitor_id;
  if (!resolvedVisitorId) {
    logger.error({ effectifId: effectif._id }, "No Brevo visitorId available, cannot send response");
    return;
  }

  const missionLocaleInfo = await getMissionLocaleInfo(effectif.mission_locale_id);
  if (!missionLocaleInfo) {
    logger.error({ missionLocaleId: effectif.mission_locale_id }, "Mission Locale not found");
    return;
  }

  const prenom = effectif.effectif_snapshot?.apprenant?.prenom || "Bonjour";
  const now = new Date();

  const inboundHistory: IWhatsAppMessageHistory = {
    direction: "inbound",
    content: text,
    sent_at: now,
    brevo_message_id: brevoMessageId,
  };

  if (isStopMessage(text)) {
    await handleStopMessage(effectif, text, resolvedVisitorId, inboundHistory);
    return;
  }

  const responseType = parseUserResponse(text);
  if (!responseType) {
    logger.info({ effectifId: effectif._id }, "Unrecognized user response");
    await updateWhatsAppContact(
      effectif._id,
      { user_response_raw: text, message_status: "read", status_updated_at: now },
      inboundHistory
    );
    return;
  }

  let responseMessage: string;
  let newState: IConversationState;

  switch (responseType) {
    case USER_RESPONSE_TYPE.CALLBACK:
      responseMessage = buildCallbackMessage(prenom, missionLocaleInfo);
      newState = CONVERSATION_STATE.CALLBACK_REQUESTED;
      break;
    case USER_RESPONSE_TYPE.NO_HELP:
      responseMessage = buildNoHelpMessage(prenom, missionLocaleInfo);
      newState = CONVERSATION_STATE.CLOSED;
      break;
    default:
      return;
  }

  await sendResponseAndUpdateContact(
    effectif,
    resolvedVisitorId,
    responseMessage,
    responseType,
    newState,
    text,
    inboundHistory
  );

  if (responseType === USER_RESPONSE_TYPE.CALLBACK) {
    await handleCallbackSideEffects(effectif);
  } else if (responseType === USER_RESPONSE_TYPE.NO_HELP) {
    await handleNoHelpSideEffects(effectif);
  }

  logger.info({ effectifId: effectif._id, responseType, newState }, "Processed inbound WhatsApp message");
}
