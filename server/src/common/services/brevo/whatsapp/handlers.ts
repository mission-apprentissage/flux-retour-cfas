import { captureException } from "@sentry/node";
import { ObjectId } from "mongodb";
import { IMissionLocaleEffectif, SITUATION_ENUM } from "shared/models/data/missionLocaleEffectif.model";
import { MISSION_LOCALE_LOG_EVENT } from "shared/models/data/missionLocaleEffectifLog.model";
import {
  IConversationState,
  IUserResponseType,
  IWhatsAppMessageHistory,
  CONVERSATION_STATE,
  USER_RESPONSE_TYPE,
} from "shared/models/data/whatsappContact.model";
import { v4 as uuidv4 } from "uuid";

import logger from "@/common/logger";
import { missionLocaleEffectifsDb, missionLocaleEffectifsLogDb } from "@/common/model/collections";
import config from "@/config";

import { sendWhatsAppMessage, sendWhatsAppTemplate, upsertBrevoContact } from "./brevoApi";
import { updateWhatsAppContact, getMissionLocaleInfo, getMissionLocaleInfoFull } from "./database";
import {
  buildAutoReplyMessage,
  buildCallbackMessage,
  buildNoHelpMessage,
  buildPrequalifNoMessage,
  buildPrequalifYesWithoutUrlMessage,
  buildStopConfirmationMessage,
  isStopMessage,
  parseUserResponse,
} from "./messages";
import { notifyMLUserOnCallback, notifyMLUserOnNoHelp, notifyMLUsersOnPrequalifYes } from "./notifications";
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
    {
      $set: { a_traiter: false, injoignable: false, updated_at: new Date() },
      $unset: {
        souhaite_rdv: "",
        souhaite_rdv_at: "",
        souhaite_rdv_source: "",
        whatsapp_callback_requested: "",
        whatsapp_callback_requested_at: "",
      },
    }
  );

  logger.info({ effectifId: effectif._id }, "User opted out via STOP");
}

/**
 * Traite les side effects d'une réponse callback (rappel souhaité)
 * Nettoie les flags no_help si l'utilisateur a changé d'avis
 */
async function handleCallbackSideEffects(effectif: IMissionLocaleEffectif): Promise<void> {
  const alreadyRequested = effectif.whatsapp_contact?.conversation_state === CONVERSATION_STATE.CALLBACK_REQUESTED;

  const now = new Date();
  await missionLocaleEffectifsDb().updateOne(
    { _id: effectif._id },
    {
      $set: {
        situation: SITUATION_ENUM.CONTACTE_SANS_RETOUR,
        a_traiter: false,
        injoignable: true,
        whatsapp_callback_requested: true,
        whatsapp_callback_requested_at: now,
        souhaite_rdv: true,
        souhaite_rdv_source: "whatsapp_callback",
        souhaite_rdv_at: now,
        updated_at: now,
      },
      $unset: {
        whatsapp_no_help_responded: "",
        whatsapp_no_help_responded_at: "",
      },
    }
  );

  if (!alreadyRequested) {
    await missionLocaleEffectifsLogDb().insertOne({
      _id: new ObjectId(),
      mission_locale_effectif_id: effectif._id,
      situation: null,
      event: MISSION_LOCALE_LOG_EVENT.WHATSAPP_PREQUALIF_YES,
      created_at: now,
      created_by: null,
      read_by: [],
    });

    await notifyMLUserOnCallback(effectif);
  }
}

/**
 * Traite les side effects d'une réponse no_help (pas d'aide souhaitée)
 * Nettoie les flags callback si l'utilisateur a changé d'avis
 */
async function handleNoHelpSideEffects(effectif: IMissionLocaleEffectif): Promise<void> {
  const now = new Date();
  await missionLocaleEffectifsDb().updateOne(
    { _id: effectif._id },
    {
      $set: {
        a_traiter: false,
        injoignable: false,
        situation: SITUATION_ENUM.NE_SOUHAITE_PAS_ETRE_RECONTACTE,
        whatsapp_no_help_responded: true,
        whatsapp_no_help_responded_at: now,
        updated_at: now,
      },
      $unset: {
        whatsapp_callback_requested: "",
        whatsapp_callback_requested_at: "",
      },
    }
  );

  await missionLocaleEffectifsLogDb().insertOne({
    _id: new ObjectId(),
    mission_locale_effectif_id: effectif._id,
    situation: SITUATION_ENUM.NE_SOUHAITE_PAS_ETRE_RECONTACTE,
    created_at: now,
    created_by: null,
    read_by: [],
  });

  await notifyMLUserOnNoHelp(effectif);
}

async function handlePrequalifYesSideEffects(effectif: IMissionLocaleEffectif): Promise<void> {
  const now = new Date();

  const cfaWentV2 = effectif.computed?.organisme?.is_allowed_collab === true;
  const cfaAccConjoint = effectif.organisme_data?.acc_conjoint === true;
  if (cfaWentV2 || cfaAccConjoint) {
    logger.warn(
      {
        effectifId: effectif._id,
        cfaWentV2,
        cfaAccConjoint,
      },
      "Préqualif YES reçu mais CFA bascule V2 / acc_conjoint entre envoi et réponse — souhaite_rdv NON posé (exclusion PRD)"
    );
    captureException(new Error("Prequalif YES skipped: CFA went V2 between send and reply"), {
      tags: { feature: "whatsapp_prequalif", step: "yes_skipped_cfa_v2" },
      extra: { effectifId: effectif._id.toString() },
    });
    return;
  }

  const currentSituation = effectif.situation;
  const shouldUnsetSituation =
    currentSituation === null ||
    currentSituation === undefined ||
    currentSituation === SITUATION_ENUM.NE_SOUHAITE_PAS_ETRE_RECONTACTE;

  const update: Record<string, unknown> = {
    $set: {
      souhaite_rdv: true,
      souhaite_rdv_at: now,
      souhaite_rdv_source: "whatsapp_prequalif",
      injoignable: false,
      a_traiter: true,
      updated_at: now,
    },
    $unset: shouldUnsetSituation
      ? {
          situation: "",
          whatsapp_no_help_responded: "",
          whatsapp_no_help_responded_at: "",
        }
      : {
          whatsapp_no_help_responded: "",
          whatsapp_no_help_responded_at: "",
        },
  };
  await missionLocaleEffectifsDb().updateOne({ _id: effectif._id }, update);

  if (!shouldUnsetSituation) {
    logger.warn(
      { effectifId: effectif._id, currentSituation },
      "Préqualif YES reçu mais situation hors flow déjà posée —> situation conservée"
    );
  }

  await missionLocaleEffectifsLogDb().insertOne({
    _id: new ObjectId(),
    mission_locale_effectif_id: effectif._id,
    situation: null,
    event: MISSION_LOCALE_LOG_EVENT.WHATSAPP_PREQUALIF_YES,
    created_at: now,
    created_by: null,
    read_by: [],
  });

  if (effectif.whatsapp_contact?.sent_via === "daily" && !effectif.whatsapp_contact?.prequalif_notif_sent_at) {
    const reserved = await missionLocaleEffectifsDb().findOneAndUpdate(
      {
        _id: effectif._id,
        "whatsapp_contact.prequalif_notif_sent_at": { $exists: false },
      },
      { $set: { "whatsapp_contact.prequalif_notif_sent_at": now } },
      { returnDocument: "after", includeResultMetadata: false }
    );
    if (reserved) {
      await notifyMLUsersOnPrequalifYes(effectif);
    } else {
      logger.info({ effectifId: effectif._id }, "Notif prequalif YES déjà envoyée (idempotence), skip");
    }
  }
}

async function handlePrequalifNoSideEffects(effectif: IMissionLocaleEffectif): Promise<void> {
  const now = new Date();
  await missionLocaleEffectifsDb().updateOne(
    { _id: effectif._id },
    {
      $set: {
        situation: SITUATION_ENUM.NE_SOUHAITE_PAS_ETRE_RECONTACTE,
        a_traiter: false,
        injoignable: false,
        updated_at: now,
      },
      $unset: {
        souhaite_rdv: "",
        souhaite_rdv_at: "",
        souhaite_rdv_source: "",
      },
    }
  );

  await missionLocaleEffectifsLogDb().insertOne({
    _id: new ObjectId(),
    mission_locale_effectif_id: effectif._id,
    situation: SITUATION_ENUM.NE_SOUHAITE_PAS_ETRE_RECONTACTE,
    event: MISSION_LOCALE_LOG_EVENT.WHATSAPP_PREQUALIF_NO,
    created_at: now,
    created_by: null,
    read_by: [],
  });
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

  const templateType = effectif.whatsapp_contact?.template_type;
  const responseType = parseUserResponse(text, templateType);
  if (!responseType) {
    logger.info({ effectifId: effectif._id }, "Unrecognized user response");

    const historyEntries: IWhatsAppMessageHistory[] = [inboundHistory];

    if (!effectif.whatsapp_contact?.auto_reply_sent) {
      const locked = await missionLocaleEffectifsDb().findOneAndUpdate(
        { _id: effectif._id, "whatsapp_contact.auto_reply_sent": { $ne: true } },
        { $set: { "whatsapp_contact.auto_reply_sent": true, "whatsapp_contact.auto_reply_sent_at": now } },
        { returnDocument: "after", includeResultMetadata: false }
      );

      if (locked) {
        const autoReplyMessage = buildAutoReplyMessage(missionLocaleInfo);
        const result = await sendWhatsAppMessage(resolvedVisitorId, autoReplyMessage);
        if (result.success) {
          historyEntries.push({
            direction: "outbound",
            content: autoReplyMessage,
            sent_at: new Date(),
            brevo_message_id: result.messageId,
          });
        } else {
          try {
            await missionLocaleEffectifsDb().updateOne(
              { _id: effectif._id },
              {
                $set: {
                  "whatsapp_contact.auto_reply_sent": false,
                  "whatsapp_contact.auto_reply_sent_at": null,
                },
              }
            );
          } catch (rollbackError) {
            logger.error({ effectifId: effectif._id, rollbackError }, "Failed to rollback auto_reply_sent flag");
          }
        }
      }
    }

    await updateWhatsAppContact(
      effectif._id,
      {
        user_response_raw: text,
        message_status: "read",
        status_updated_at: now,
        conversation_state: CONVERSATION_STATE.USER_RESPONDED,
      },
      historyEntries
    );
    return;
  }

  if (responseType === USER_RESPONSE_TYPE.PREQUALIF_YES) {
    await handlePrequalifYes(effectif, resolvedVisitorId, text, inboundHistory, prenom);
    logger.info({ effectifId: effectif._id, responseType }, "Processed inbound WhatsApp prequalif YES");
    return;
  }
  if (responseType === USER_RESPONSE_TYPE.PREQUALIF_NO) {
    await handlePrequalifNo(effectif, resolvedVisitorId, text, inboundHistory, prenom);
    logger.info({ effectifId: effectif._id, responseType }, "Processed inbound WhatsApp prequalif NO");
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

async function handlePrequalifYes(
  effectif: IMissionLocaleEffectif,
  resolvedVisitorId: string,
  text: string,
  inboundHistory: IWhatsAppMessageHistory,
  prenom: string
): Promise<void> {
  await handlePrequalifYesSideEffects(effectif);

  const ml = await getMissionLocaleInfoFull(effectif.mission_locale_id);
  if (!ml) {
    logger.error(
      { missionLocaleId: effectif.mission_locale_id },
      "Mission Locale not found for prequalif YES follow-up"
    );
    return;
  }

  const targetPhone = effectif.whatsapp_contact?.phone_normalized;
  const templateId = config.brevo.whatsapp?.templatePrequalifYesWithUrlId;

  // Visibilité ops : si la ML a un rdv_url mais que le template YES-with-URL est manquant,
  // on fallback gracieusement sur le message texte libre — mais le jeune ne reçoit PAS
  // le CTA "Prendre rendez-vous". Log Sentry pour détection rapide post-déploiement.
  if (ml.rdv_url && targetPhone && !templateId) {
    captureException(new Error("templatePrequalifYesWithUrlId not configured — fallback to text message"), {
      tags: { feature: "whatsapp_prequalif", step: "follow_up_yes_template_missing" },
      extra: { effectifId: effectif._id.toString(), mlId: effectif.mission_locale_id.toString() },
    });
  }

  if (ml.rdv_url && targetPhone && templateId) {
    const token = uuidv4();
    const now = new Date();
    await missionLocaleEffectifsDb().updateOne(
      { _id: effectif._id },
      {
        $set: {
          "whatsapp_contact.rdv_redirect_token": token,
          "whatsapp_contact.rdv_redirect_token_created_at": now,
        },
      }
    );

    const redirectUrl = `${config.publicUrl}/r/${token}`;

    await upsertBrevoContact(targetPhone, {
      TBA_EFFECTIF_PRENOM_WHATSAPP: prenom,
      TBA_EFFECTIF_MISSION_LOCALE_NOM_WHATSAPP: ml.nom,
      TBA_EFFECTIF_REDIRECT_URL_WHATSAPP: redirectUrl,
    });

    const result = await sendWhatsAppTemplate(targetPhone, { templateId });
    const historyEntries: IWhatsAppMessageHistory[] = [inboundHistory];
    if (result.success) {
      historyEntries.push({
        direction: "outbound",
        content: `[Template prequalif_yes_with_url] prenom=${prenom}, ml=${ml.nom}, redirect=${redirectUrl}`,
        sent_at: new Date(),
        brevo_message_id: result.messageId,
      });
    }
    await updateWhatsAppContact(
      effectif._id,
      {
        user_response: USER_RESPONSE_TYPE.PREQUALIF_YES,
        user_response_at: now,
        user_response_raw: text,
        conversation_state: CONVERSATION_STATE.CLOSED,
        message_status: "read",
        status_updated_at: now,
      },
      historyEntries
    );
    return;
  }

  const message = buildPrequalifYesWithoutUrlMessage(prenom, ml);
  try {
    await sendResponseAndUpdateContact(
      effectif,
      resolvedVisitorId,
      message,
      USER_RESPONSE_TYPE.PREQUALIF_YES,
      CONVERSATION_STATE.CLOSED,
      text,
      inboundHistory
    );
  } catch (err) {
    logger.error(
      { err, effectifId: effectif._id, mlId: effectif.mission_locale_id },
      "Échec envoi confirmation YES texte libre (no rdv_url) — YES enregistré côté DB"
    );
    captureException(err, {
      tags: { feature: "whatsapp_prequalif", step: "follow_up_yes_no_url" },
      extra: { effectifId: effectif._id.toString() },
    });
  }
}

async function handlePrequalifNo(
  effectif: IMissionLocaleEffectif,
  resolvedVisitorId: string,
  text: string,
  inboundHistory: IWhatsAppMessageHistory,
  prenom: string
): Promise<void> {
  await handlePrequalifNoSideEffects(effectif);

  const ml = await getMissionLocaleInfoFull(effectif.mission_locale_id);
  if (!ml) {
    logger.error(
      { missionLocaleId: effectif.mission_locale_id },
      "Mission Locale not found for prequalif NO follow-up"
    );
    return;
  }

  const message = buildPrequalifNoMessage(prenom, ml);
  await sendResponseAndUpdateContact(
    effectif,
    resolvedVisitorId,
    message,
    USER_RESPONSE_TYPE.PREQUALIF_NO,
    CONVERSATION_STATE.CLOSED,
    text,
    inboundHistory
  );
}
