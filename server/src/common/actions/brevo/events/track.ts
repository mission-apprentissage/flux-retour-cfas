import logger from "@/common/logger";
import { sendBrevoEvent } from "@/common/services/brevo/brevo";

import { isBrevoEventsActive } from "../contacts/sync-settings.actions";

import { getBrevoEvent } from "./registry";
import { BrevoEventInput } from "./types";

/**
 * Construit et envoie un événement Brevo pour un usecase donné. Appelé par le
 * handler de job `brevo-events:track`. No-op si `buildPayload` renvoie `null`
 * (contact hors périmètre).
 */
export const trackBrevoEvent = async (key: string, input: BrevoEventInput) => {
  // Garde prod-only côté CONSUMER : TOUS les envois passent ici. Sans elle, un appel
  // synchrone au handler (CLI `brevo-events:track-one`, `job:run`) court-circuiterait la
  // garde d'enqueue et émettrait un événement RÉEL hors production. Défense en profondeur
  // avec la garde de `enqueueBrevoEvent`. `isBrevoEventsActive` revérifie config.env === prod.
  if (!(await isBrevoEventsActive())) {
    logger.warn({ key, ...input }, "Brevo event skipped (événements inactifs ou hors production)");
    return;
  }

  const def = getBrevoEvent(key);
  const built = await def.buildPayload(input);
  if (!built) {
    logger.info({ key, ...input }, "Brevo event skipped (hors périmètre)");
    return;
  }
  await sendBrevoEvent({ eventName: def.eventName, ...built });
  logger.info({ key, eventName: def.eventName, ...input }, "Brevo event sent");
};
