import { captureException } from "@sentry/node";
import { IMissionLocaleEffectif, SITUATION_ENUM } from "shared/models/data/missionLocaleEffectif.model";

import logger from "@/common/logger";
import { missionLocaleEffectifsLogDb, usersMigrationDb } from "@/common/model/collections";
import { sendEmail } from "@/common/services/mailer/mailer";
import { getPublicUrl } from "@/common/utils/emailsUtils";

/**
 * Envoie une notification email à l'utilisateur ML qui a travaillé sur le dossier
 * lors d'une réponse WhatsApp (callback ou no_help).
 */
async function sendMLWhatsAppNotification(
  effectif: IMissionLocaleEffectif,
  templateName: "whatsapp_callback_notification" | "whatsapp_nohelp_notification",
  logLabel: string
): Promise<void> {
  try {
    const log = await missionLocaleEffectifsLogDb().findOne(
      {
        mission_locale_effectif_id: effectif._id,
        situation: SITUATION_ENUM.CONTACTE_SANS_RETOUR,
      },
      { sort: { created_at: -1 } }
    );

    if (!log?.created_by) {
      logger.warn({ effectifId: effectif._id }, `No ML user found for ${logLabel} notification`);
      return;
    }

    const user = await usersMigrationDb().findOne(
      { _id: log.created_by },
      { projection: { email: 1, nom: 1, prenom: 1 } }
    );

    if (!user) {
      logger.warn({ userId: log.created_by }, "ML user not found in usersMigration");
      return;
    }

    const effectifPrenom = effectif.effectif_snapshot?.apprenant?.prenom || "";
    const effectifNom = effectif.effectif_snapshot?.apprenant?.nom || "";

    const lienFiche = getPublicUrl(`/mission-locale/${effectif.effectif_id}`);

    const dateContacteSansRetour = log.created_at.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    await sendEmail(
      user.email,
      templateName,
      {
        recipient: {
          nom: user.nom,
          prenom: user.prenom,
        },
        effectif: {
          prenom: effectifPrenom,
          nom: effectifNom,
        },
        lien_fiche: lienFiche,
        date_contacte_sans_retour: dateContacteSansRetour,
      },
      { noreply: true }
    );

    logger.info({ effectifId: effectif._id }, `WhatsApp ${logLabel} notification email sent`);
  } catch (error) {
    logger.error(
      {
        effectifId: effectif._id,
        error: error instanceof Error ? error.message : String(error),
      },
      `Failed to send WhatsApp ${logLabel} notification`
    );
    captureException(error);
  }
}

/**
 * Notifie l'utilisateur ML quand un effectif demande à être recontacté
 */
export async function notifyMLUserOnCallback(effectif: IMissionLocaleEffectif): Promise<void> {
  await sendMLWhatsAppNotification(effectif, "whatsapp_callback_notification", "callback");
}

/**
 * Notifie l'utilisateur ML quand un effectif ne souhaite pas être recontacté
 */
export async function notifyMLUserOnNoHelp(effectif: IMissionLocaleEffectif): Promise<void> {
  await sendMLWhatsAppNotification(effectif, "whatsapp_nohelp_notification", "nohelp");
}
