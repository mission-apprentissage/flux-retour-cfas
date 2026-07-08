import { ObjectId } from "bson";
import { addJob } from "job-processor";

import logger from "@/common/logger";

import { isBrevoInstantSyncActive } from "./sync-settings.actions";

/**
 * Enfile (asynchrone) une synchro Brevo unitaire pour un utilisateur.
 *
 * - No-op si le toggle de synchro instantanée est désactivé (ou hors prod).
 * - Ne lève jamais : ces appels sont placés sur des chemins critiques
 *   (création/validation de compte) et ne doivent jamais les faire échouer.
 */
export const enqueueBrevoContactSync = async (userId: ObjectId | string): Promise<void> => {
  try {
    if (!(await isBrevoInstantSyncActive())) return;
    await addJob({ name: "brevo-contacts:sync-one", payload: { userId: String(userId) }, queued: true });
  } catch (err) {
    logger.error({ err, userId: String(userId) }, "Échec de l'enqueue de la synchro Brevo unitaire");
  }
};
