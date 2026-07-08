import { addJob } from "job-processor";

import logger from "@/common/logger";

import { isBrevoEventsActive } from "../contacts/sync-settings.actions";

import { BrevoEventInput } from "./types";

/**
 * Enfile (asynchrone) l'émission d'un événement Brevo pour un usecase.
 *
 * - No-op si le toggle d'événements est désactivé (ou hors prod : `isBrevoEventsActive`
 *   revérifie `config.env === "production"`).
 * - Ne lève jamais : ces appels sont placés sur des chemins critiques
 *   (validation/confirmation de compte) et ne doivent jamais les faire échouer.
 */
export const enqueueBrevoEvent = async (key: string, input: BrevoEventInput): Promise<void> => {
  try {
    if (!(await isBrevoEventsActive())) return;
    await addJob({ name: "brevo-events:track", payload: { key, ...input }, queued: true });
  } catch (err) {
    logger.error({ err, key, ...input }, "Échec de l'enqueue de l'événement Brevo");
  }
};
