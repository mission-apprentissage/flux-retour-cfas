import { ObjectId } from "mongodb";

import parentLogger from "@/common/logger";
import { reserveAndSendInjoignables } from "@/common/services/brevo/whatsapp/injoignables";
import { nextRetryDelayMs, scheduleWhatsAppInitial } from "@/common/services/brevo/whatsapp/queue";

const logger = parentLogger.child({ module: "job:whatsapp:send-initial" });

export type SendInitialOutcome =
  | { outcome: "sent" }
  | { outcome: "retry_scheduled"; attempt: number; delayMs: number }
  | { outcome: "failed"; reason: string }
  | { outcome: "skipped"; reason: string };

interface SendInitialOptions {
  effectifId: ObjectId | string;
  missionLocaleId: ObjectId | string;
  attempt: number;
}

/**
 * Premier message WhatsApp « injoignables », enfilé quand l'agent ML marque un dossier « contacté sans retour ».
 * Réessai seulement si Brevo n'a sûrement rien traité (`safeToRetry`), pour ne jamais doubler un message.
 */
export async function sendWhatsAppInitial({
  effectifId,
  missionLocaleId,
  attempt,
}: SendInitialOptions): Promise<SendInitialOutcome> {
  const delayMs = nextRetryDelayMs(attempt);
  const result = await reserveAndSendInjoignables({
    effectifId: new ObjectId(String(effectifId)),
    missionLocaleId: new ObjectId(String(missionLocaleId)),
    attempt,
    canRetry: delayMs !== null,
  });

  if (result.outcome === "retry" && delayMs !== null) {
    await scheduleWhatsAppInitial(effectifId, missionLocaleId, { attempt: attempt + 1, delayMs });
    logger.warn({ effectifId: String(effectifId), attempt, delayMs }, "Message WhatsApp initial replanifié");
    return { outcome: "retry_scheduled", attempt: attempt + 1, delayMs };
  }
  return result as SendInitialOutcome;
}
