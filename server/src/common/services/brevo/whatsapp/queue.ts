import { addJob } from "job-processor";
import { ObjectId } from "mongodb";

import logger from "@/common/logger";
import { captureTiered } from "@/common/services/sentry/alertContract";

export const WHATSAPP_REPLY_JOB = "whatsapp:send-reply";

const WHATSAPP_REPLY_KINDS = ["prequalif_yes", "prequalif_no", "callback", "no_help", "stop", "auto_reply"] as const;
export type WhatsAppReplyKind = (typeof WHATSAPP_REPLY_KINDS)[number];

/** Délai avant la reprise n°i+1 : au plus 3 reprises, soit 4 tentatives au total. */
export const WHATSAPP_RETRY_DELAYS_MS = [60_000, 5 * 60_000, 15 * 60_000] as const;

export const isWhatsAppReplyKind = (value: unknown): value is WhatsAppReplyKind =>
  (WHATSAPP_REPLY_KINDS as readonly unknown[]).includes(value);

/** Délai avant la tentative suivante, ou `null` quand `attempt` était la dernière. */
export const nextRetryDelayMs = (attempt: number): number | null => WHATSAPP_RETRY_DELAYS_MS[attempt - 1] ?? null;

/**
 * Le payload ne porte que des identifiants : prénom, téléphone et texte du message sont relus
 * en base par le job, pour ne pas les copier dans la collection des jobs.
 */
export async function scheduleWhatsAppReply(
  effectifId: ObjectId | string,
  kind: WhatsAppReplyKind,
  { attempt = 1, delayMs = 0 }: { attempt?: number; delayMs?: number } = {}
): Promise<void> {
  await addJob({
    name: WHATSAPP_REPLY_JOB,
    payload: { effectifId: String(effectifId), kind, attempt },
    scheduled_for: new Date(Date.now() + delayMs),
    queued: true,
  });
}

/**
 * Enfile l'envoi d'une réponse WhatsApp hors du chemin HTTP du webhook.
 * Ne lève jamais : l'état de la conversation est déjà enregistré, un échec d'enqueue ne doit pas
 * faire rejouer le webhook par Brevo. Renvoie `false` si la réponse n'a pas pu être enfilée.
 */
export async function enqueueWhatsAppReply(effectifId: ObjectId | string, kind: WhatsAppReplyKind): Promise<boolean> {
  try {
    await scheduleWhatsAppReply(effectifId, kind);
    return true;
  } catch (err) {
    logger.error({ err, effectifId: String(effectifId), kind }, "Échec de l'enqueue de la réponse WhatsApp");
    captureTiered(err, { errorKind: "db", fingerprintKey: "whatsapp:enqueue-reply", extra: { kind } });
    return false;
  }
}
