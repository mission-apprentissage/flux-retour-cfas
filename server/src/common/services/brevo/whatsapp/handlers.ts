import { randomUUID } from "node:crypto";

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

import logger from "@/common/logger";
import { missionLocaleEffectifsDb, missionLocaleEffectifsLogDb } from "@/common/model/collections";

import { updateWhatsAppContact, getMissionLocaleInfo, getMissionLocaleInfoFull } from "./database";
import { isExcludedByCfaCollab } from "./eligibility";
import { isStopMessage, parseUserResponse } from "./messages";
import { notifyMLUserOnCallback, notifyMLUserOnNoHelp, notifyMLUsersOnPrequalifYes } from "./notifications";
import { maskPhone, normalizePhoneNumber } from "./phone";
import { enqueueWhatsAppReply, type WhatsAppReplyKind } from "./queue";

/**
 * Gère un message STOP : opt-out RGPD. L'opt-out est enregistré avant tout envoi ; la confirmation
 * part par job.
 */
async function handleStopMessage(
  effectif: IMissionLocaleEffectif,
  text: string,
  inboundHistory: IWhatsAppMessageHistory
): Promise<void> {
  const now = new Date();

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
    [inboundHistory]
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

  await enqueueWhatsAppReply(effectif._id, "stop");

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
        // passage automatique : daté, mais sans date_derniere_action_ml (pas une action ML)
        date_dernier_passage_a_recontacter: now,
        date_traitement: null,
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
      event: MISSION_LOCALE_LOG_EVENT.WHATSAPP_YES_HELP,
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
 *
 * Idempotence : si la conversation est déjà CLOSED, le premier no_help a été traité —
 * on skip le $set/log/notif (le brevoMessageId dedup couvre déjà les replays webhook,
 * cette garde couvre le cas "user envoie un 2e message no_help après clôture").
 */
async function handleNoHelpSideEffects(effectif: IMissionLocaleEffectif): Promise<void> {
  if (effectif.whatsapp_contact?.conversation_state === CONVERSATION_STATE.CLOSED) {
    logger.info({ effectifId: effectif._id }, "no_help déjà traité (conversation CLOSED), skip $set + log + notif");
    return;
  }

  const now = new Date();
  await missionLocaleEffectifsDb().updateOne(
    { _id: effectif._id },
    {
      $set: {
        a_traiter: false,
        injoignable: false,
        situation: SITUATION_ENUM.NE_SOUHAITE_PAS_ETRE_RECONTACTE,
        // Traitement automatique : le dossier est considéré traité par le TBA à cette date.
        date_traitement: now,
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
    event: MISSION_LOCALE_LOG_EVENT.WHATSAPP_NO_HELP,
    created_at: now,
    created_by: null,
    read_by: [],
  });

  await notifyMLUserOnNoHelp(effectif);
}

async function handlePrequalifYesSideEffects(effectif: IMissionLocaleEffectif): Promise<void> {
  const now = new Date();

  const alreadyClosed = effectif.whatsapp_contact?.conversation_state === CONVERSATION_STATE.CLOSED;

  // Idempotence : si la conversation est déjà CLOSED, le premier YES a été traité.
  // Re-appliquer le $set réécraserait `souhaite_rdv_at` avec un `now` ultérieur (drift métier).
  // La notif ML conserve sa propre garde (`prequalif_notif_sent_at`).
  if (alreadyClosed) {
    logger.info({ effectifId: effectif._id }, "Préqualif YES déjà traité (conversation CLOSED), skip $set + log");
  } else {
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
        // Le dossier redevient « à traiter » : une date de traitement antérieure est obsolète.
        ...(shouldUnsetSituation ? { date_traitement: null } : {}),
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
  }

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
  // Idempotence : symétrique de handlePrequalifYesSideEffects — si conversation CLOSED,
  // un NO a déjà été traité, on évite de réécrire la situation et de dupliquer le log.
  if (effectif.whatsapp_contact?.conversation_state === CONVERSATION_STATE.CLOSED) {
    logger.info({ effectifId: effectif._id }, "Préqualif NO déjà traité (conversation CLOSED), skip $set + log");
    return;
  }

  const now = new Date();
  await missionLocaleEffectifsDb().updateOne(
    { _id: effectif._id },
    {
      $set: {
        situation: SITUATION_ENUM.NE_SOUHAITE_PAS_ETRE_RECONTACTE,
        a_traiter: false,
        injoignable: false,
        // Traitement automatique : le dossier est considéré traité par le TBA à cette date.
        date_traitement: now,
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
 * Enregistre la réponse du jeune (état de la conversation, entrée entrante de l'historique) puis enfile
 * l'envoi de la réponse. L'enregistrement passe avant l'enqueue : le job ajoute l'entrée sortante après
 * l'entrante, et un rejeu du webhook est dédoublonné par `brevo_message_id`.
 */
async function recordResponseAndEnqueueReply(
  effectif: IMissionLocaleEffectif,
  replyKind: WhatsAppReplyKind,
  responseType: IUserResponseType,
  newState: IConversationState,
  text: string,
  inboundHistory: IWhatsAppMessageHistory
): Promise<void> {
  const now = new Date();
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
    [inboundHistory]
  );
  await enqueueWhatsAppReply(effectif._id, replyKind);
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

  const setFields: Record<string, unknown> = { updated_at: new Date() };
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

  const now = new Date();

  const inboundHistory: IWhatsAppMessageHistory = {
    direction: "inbound",
    content: text,
    sent_at: now,
    brevo_message_id: brevoMessageId,
  };

  if (isStopMessage(text)) {
    await handleStopMessage(effectif, text, inboundHistory);
    return;
  }

  const templateType = effectif.whatsapp_contact?.template_type;
  const responseType = parseUserResponse(text, templateType);
  if (!responseType) {
    logger.info({ effectifId: effectif._id }, "Unrecognized user response");

    let autoReplyLocked = false;
    if (!effectif.whatsapp_contact?.auto_reply_sent) {
      const locked = await missionLocaleEffectifsDb().findOneAndUpdate(
        { _id: effectif._id, "whatsapp_contact.auto_reply_sent": { $ne: true } },
        { $set: { "whatsapp_contact.auto_reply_sent": true, "whatsapp_contact.auto_reply_sent_at": now } },
        { returnDocument: "after", includeResultMetadata: false }
      );
      autoReplyLocked = !!locked;
    }

    await updateWhatsAppContact(
      effectif._id,
      {
        user_response_raw: text,
        message_status: "read",
        status_updated_at: now,
        conversation_state: CONVERSATION_STATE.USER_RESPONDED,
      },
      [inboundHistory]
    );

    if (autoReplyLocked && !(await enqueueWhatsAppReply(effectif._id, "auto_reply"))) {
      // Rien ne partira : on libère le verrou pour que le prochain message non reconnu relance une réponse.
      try {
        await missionLocaleEffectifsDb().updateOne(
          { _id: effectif._id },
          { $set: { "whatsapp_contact.auto_reply_sent": false, "whatsapp_contact.auto_reply_sent_at": null } }
        );
      } catch (rollbackError) {
        logger.error({ effectifId: effectif._id, rollbackError }, "Failed to rollback auto_reply_sent flag");
      }
    }
    return;
  }

  if (responseType === USER_RESPONSE_TYPE.PREQUALIF_YES) {
    await handlePrequalifYes(effectif, text, inboundHistory);
    logger.info({ effectifId: effectif._id, responseType }, "Processed inbound WhatsApp prequalif YES");
    return;
  }
  if (responseType === USER_RESPONSE_TYPE.PREQUALIF_NO) {
    await handlePrequalifNo(effectif, text, inboundHistory);
    logger.info({ effectifId: effectif._id, responseType }, "Processed inbound WhatsApp prequalif NO");
    return;
  }

  let replyKind: WhatsAppReplyKind;
  let newState: IConversationState;

  switch (responseType) {
    case USER_RESPONSE_TYPE.CALLBACK:
      replyKind = "callback";
      newState = CONVERSATION_STATE.CALLBACK_REQUESTED;
      break;
    case USER_RESPONSE_TYPE.NO_HELP:
      replyKind = "no_help";
      newState = CONVERSATION_STATE.CLOSED;
      break;
    default:
      return;
  }

  await recordResponseAndEnqueueReply(effectif, replyKind, responseType, newState, text, inboundHistory);

  if (responseType === USER_RESPONSE_TYPE.CALLBACK) {
    await handleCallbackSideEffects(effectif);
  } else if (responseType === USER_RESPONSE_TYPE.NO_HELP) {
    await handleNoHelpSideEffects(effectif);
  }

  logger.info({ effectifId: effectif._id, responseType, newState }, "Processed inbound WhatsApp message");
}

async function handlePrequalifYes(
  effectif: IMissionLocaleEffectif,
  text: string,
  inboundHistory: IWhatsAppMessageHistory
): Promise<void> {
  // Exclusion PRD (race send/réponse) : le dossier est passé côté collab CFA depuis l'envoi.
  // Aucun souhaite_rdv, aucune notif ML — donc surtout pas de message promettant un rappel.
  // On enregistre l'entrant et on clôt la conversation pour rester idempotent sur les répétitions.
  if (isExcludedByCfaCollab(effectif)) {
    if (effectif.whatsapp_contact?.conversation_state !== CONVERSATION_STATE.CLOSED) {
      logger.warn(
        {
          effectifId: effectif._id,
          cfaWentV2: effectif.computed?.organisme?.is_allowed_collab === true,
          cfaAccConjoint: effectif.organisme_data?.acc_conjoint === true,
        },
        "Préqualif YES reçu mais CFA bascule V2 / acc_conjoint entre envoi et réponse — souhaite_rdv NON posé (exclusion PRD)"
      );
    }
    const now = new Date();
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
      [inboundHistory]
    );
    return;
  }

  await handlePrequalifYesSideEffects(effectif);

  const ml = await getMissionLocaleInfoFull(effectif.mission_locale_id);
  if (!ml) {
    logger.error(
      { missionLocaleId: effectif.mission_locale_id },
      "Mission Locale not found for prequalif YES follow-up"
    );
    return;
  }

  // Le jeton est posé avant l'enqueue : le job construit le lien de rendez-vous à partir de lui.
  if (ml.rdv_url) {
    await missionLocaleEffectifsDb().updateOne(
      { _id: effectif._id },
      {
        $set: {
          "whatsapp_contact.rdv_redirect_token": randomUUID(),
          "whatsapp_contact.rdv_redirect_token_created_at": new Date(),
        },
      }
    );
  }

  try {
    await recordResponseAndEnqueueReply(
      effectif,
      "prequalif_yes",
      USER_RESPONSE_TYPE.PREQUALIF_YES,
      CONVERSATION_STATE.CLOSED,
      text,
      inboundHistory
    );
  } catch (err) {
    logger.error(
      { err, effectifId: effectif._id, mlId: effectif.mission_locale_id, hasRdvUrl: !!ml.rdv_url },
      "Échec enregistrement de la réponse YES texte libre — YES enregistré côté DB"
    );
    captureException(err, {
      tags: { feature: "whatsapp_prequalif", step: "follow_up_yes" },
      extra: { effectifId: effectif._id.toString(), hasRdvUrl: !!ml.rdv_url },
    });
  }
}

async function handlePrequalifNo(
  effectif: IMissionLocaleEffectif,
  text: string,
  inboundHistory: IWhatsAppMessageHistory
): Promise<void> {
  await handlePrequalifNoSideEffects(effectif);

  await recordResponseAndEnqueueReply(
    effectif,
    "prequalif_no",
    USER_RESPONSE_TYPE.PREQUALIF_NO,
    CONVERSATION_STATE.CLOSED,
    text,
    inboundHistory
  );
}
