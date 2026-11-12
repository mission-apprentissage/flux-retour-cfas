import { ObjectId } from "mongodb";
import { IMissionLocaleEffectif } from "shared/models/data/missionLocaleEffectif.model";

import parentLogger from "@/common/logger";
import { missionLocaleEffectifsDb } from "@/common/model/collections";
import { sendWhatsAppMessage } from "@/common/services/brevo/whatsapp/brevoApi";
import {
  getMissionLocaleInfo,
  getMissionLocaleInfoFull,
  updateWhatsAppContact,
} from "@/common/services/brevo/whatsapp/database";
import {
  buildAutoReplyMessage,
  buildCallbackMessage,
  buildNoHelpMessage,
  buildPrequalifNoMessage,
  buildPrequalifYesWithUrlInlineMessage,
  buildPrequalifYesWithoutUrlMessage,
  buildStopConfirmationMessage,
} from "@/common/services/brevo/whatsapp/messages";
import {
  nextRetryDelayMs,
  scheduleWhatsAppReply,
  type WhatsAppReplyKind,
} from "@/common/services/brevo/whatsapp/queue";
import { captureTiered } from "@/common/services/sentry/alertContract";
import config from "@/config";

const logger = parentLogger.child({ module: "job:whatsapp:send-reply" });

export type SendReplyOutcome =
  | { outcome: "sent" }
  | { outcome: "retry_scheduled"; attempt: number; delayMs: number }
  | { outcome: "failed"; reason: string }
  | { outcome: "skipped"; reason: string };

interface SendReplyOptions {
  effectifId: ObjectId | string;
  kind: WhatsAppReplyKind;
  attempt: number;
}

/** Reconstruit le texte depuis la base : le job ne reçoit que des identifiants. */
async function buildReplyMessage(effectif: IMissionLocaleEffectif, kind: WhatsAppReplyKind): Promise<string | null> {
  if (kind === "stop") {
    return buildStopConfirmationMessage();
  }

  const prenom = effectif.effectif_snapshot?.apprenant?.prenom || "Bonjour";

  if (kind === "prequalif_yes" || kind === "prequalif_no") {
    const ml = await getMissionLocaleInfoFull(effectif.mission_locale_id);
    if (!ml) return null;
    if (kind === "prequalif_no") return buildPrequalifNoMessage(prenom, ml);

    const token = effectif.whatsapp_contact?.rdv_redirect_token;
    return ml.rdv_url && token
      ? buildPrequalifYesWithUrlInlineMessage(prenom, ml, `${config.publicUrl}/api/r/${token}`)
      : buildPrequalifYesWithoutUrlMessage(prenom, ml);
  }

  const ml = await getMissionLocaleInfo(effectif.mission_locale_id);
  if (!ml) return null;
  switch (kind) {
    case "callback":
      return buildCallbackMessage(prenom, ml);
    case "no_help":
      return buildNoHelpMessage(prenom, ml);
    case "auto_reply":
      return buildAutoReplyMessage(ml);
  }
}

/**
 * Envoie une réponse WhatsApp décidée par le webhook. L'état de la conversation est déjà enregistré
 * par le webhook ; ce job ne fait que l'envoi et la trace de l'entrée sortante.
 *
 * Réessai : seulement si Brevo n'a sûrement rien traité (`safeToRetry`), sinon un timeout pourrait
 * doubler un message déjà parti. Délais dans `WHATSAPP_RETRY_DELAYS_MS`.
 */
export async function sendWhatsAppReply({ effectifId, kind, attempt }: SendReplyOptions): Promise<SendReplyOutcome> {
  const _id = new ObjectId(String(effectifId));
  const effectif = await missionLocaleEffectifsDb().findOne({ _id });
  if (!effectif || effectif.soft_deleted) {
    logger.warn({ effectifId: String(_id), kind }, "Effectif introuvable ou supprimé, réponse WhatsApp abandonnée");
    return { outcome: "skipped", reason: "effectif_introuvable" };
  }

  // Un STOP reçu entre-temps prime : seule la confirmation du STOP lui-même part.
  if (kind !== "stop" && effectif.whatsapp_contact?.opted_out) {
    logger.info({ effectifId: String(_id), kind }, "Effectif désinscrit, réponse WhatsApp abandonnée");
    return { outcome: "skipped", reason: "opted_out" };
  }

  const visitorId = effectif.whatsapp_contact?.brevo_visitor_id;
  if (!visitorId) {
    logger.error({ effectifId: String(_id), kind }, "Aucun visitorId Brevo, réponse WhatsApp impossible");
    captureTiered(new Error("Réponse WhatsApp impossible : visitorId Brevo absent"), {
      errorKind: "data-drift",
      fingerprintKey: "whatsapp:send-reply:visitor-id-absent",
      extra: { kind },
    });
    return { outcome: "failed", reason: "visitor_id_absent" };
  }

  const message = await buildReplyMessage(effectif, kind);
  if (!message) {
    logger.error({ effectifId: String(_id), kind }, "Mission Locale introuvable, réponse WhatsApp abandonnée");
    return { outcome: "failed", reason: "mission_locale_introuvable" };
  }

  const result = await sendWhatsAppMessage(visitorId, message);

  if (result.success) {
    await updateWhatsAppContact(_id, {}, [
      { direction: "outbound", content: message, sent_at: new Date(), brevo_message_id: result.messageId },
    ]);
    return { outcome: "sent" };
  }

  const delayMs = result.safeToRetry ? nextRetryDelayMs(attempt) : null;
  if (delayMs !== null) {
    await scheduleWhatsAppReply(_id, kind, { attempt: attempt + 1, delayMs });
    logger.warn(
      { effectifId: String(_id), kind, attempt, delayMs, status: result.status },
      "Réponse WhatsApp replanifiée"
    );
    return { outcome: "retry_scheduled", attempt: attempt + 1, delayMs };
  }

  logger.error(
    {
      effectifId: String(_id),
      kind,
      attempt,
      status: result.status,
      safeToRetry: result.safeToRetry,
      error: result.error,
    },
    "Réponse WhatsApp abandonnée"
  );

  // La réponse automatique n'a pas été envoyée : on libère le verrou pour que le prochain message
  // non reconnu du jeune en déclenche une autre.
  if (kind === "auto_reply") {
    await missionLocaleEffectifsDb().updateOne(
      { _id },
      { $set: { "whatsapp_contact.auto_reply_sent": false, "whatsapp_contact.auto_reply_sent_at": null } }
    );
  }

  return { outcome: "failed", reason: result.safeToRetry ? "tentatives_epuisees" : "echec_brevo" };
}
