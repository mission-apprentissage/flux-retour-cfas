import { SITUATION_ENUM } from "shared/models/data/missionLocaleEffectif.model";

import parentLogger from "@/common/logger";
import { missionLocaleEffectifsDb } from "@/common/model/collections";
import { isEligibleForWhatsApp, triggerWhatsAppIfEligible } from "@/common/services/brevo/whatsapp";
import config from "@/config";

const logger = parentLogger.child({
  module: "job:whatsapp:send-injoignables",
});

interface SendWhatsAppInjoignablesOptions {
  dryRun: boolean;
}

async function getEligibleEffectifs() {
  const now = new Date();
  const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  return missionLocaleEffectifsDb()
    .aggregate([
      {
        $match: {
          situation: SITUATION_ENUM.CONTACTE_SANS_RETOUR,
          date_rupture: { $gte: threeMonthsAgo },
          soft_deleted: { $ne: true },
          $or: [
            { whatsapp_contact: { $exists: false } },
            { "whatsapp_contact.last_message_sent_at": { $exists: false } },
          ],
          "whatsapp_contact.opted_out": { $ne: true },
        },
      },
      {
        $lookup: {
          from: "missionLocaleEffectifLog",
          let: { effectif_id: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$mission_locale_effectif_id", "$$effectif_id"] },
                situation: SITUATION_ENUM.CONTACTE_SANS_RETOUR,
              },
            },
            { $sort: { created_at: -1 } },
            { $limit: 1 },
          ],
          as: "last_injoignable_log",
        },
      },
      {
        $match: {
          "last_injoignable_log.0.created_at": { $gte: oneMonthAgo },
        },
      },
      {
        $project: {
          _id: 1,
          mission_locale_id: 1,
        },
      },
    ])
    .toArray();
}

export async function sendWhatsAppInjoignables({ dryRun }: SendWhatsAppInjoignablesOptions) {
  if (config.env !== "production") {
    logger.warn("whatsapp:send-injoignables can only be run in production environment");
    return 0;
  }

  logger.info({ dryRun }, "Début du job tmp:whatsapp:send-injoignables");

  if (!config.brevo.whatsapp?.enabled) {
    logger.error("ABANDON : WhatsApp est désactivé (MNA_TDB_WHATSAPP_ENABLED != true)");
    return 1;
  }

  if (!config.brevo.whatsapp?.templateInjoignablesId) {
    logger.error("ABANDON : Template WhatsApp non configuré (MNA_TDB_WHATSAPP_TEMPLATE_INJOIGNABLES_ID)");
    return 1;
  }

  if (!config.brevo.apiKey) {
    logger.error("ABANDON : Clé API Brevo non configurée (MNA_TDB_BREVO_API_KEY)");
    return 1;
  }

  logger.info({ templateId: config.brevo.whatsapp.templateInjoignablesId }, "Configuration WhatsApp OK");

  const eligibleEffectifs = await getEligibleEffectifs();
  const total = eligibleEffectifs.length;

  logger.info({ total, dryRun }, `${total} effectifs éligibles trouvés`);

  if (dryRun) {
    logger.info({ total }, "Mode dry-run : aucun message envoyé");
    return 0;
  }

  if (total === 0) {
    logger.info("Aucun effectif éligible, fin du job");
    return 0;
  }

  let processed = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < total; i++) {
    const { _id: effectifId, mission_locale_id: missionLocaleId } = eligibleEffectifs[i];

    logger.info({ effectifId, progress: `${i + 1}/${total}` }, `Traitement effectif ${i + 1}/${total}`);

    try {
      const freshEffectif = await missionLocaleEffectifsDb().findOne({ _id: effectifId });

      if (!freshEffectif) {
        logger.warn({ effectifId }, "Effectif introuvable lors du re-fetch, skip");
        skipped++;
        continue;
      }

      if (!isEligibleForWhatsApp(freshEffectif)) {
        logger.info({ effectifId }, "Effectif plus éligible au moment de l'envoi (race condition évitée), skip");
        skipped++;
        continue;
      }

      await triggerWhatsAppIfEligible(freshEffectif, missionLocaleId);
      processed++;
      logger.info({ effectifId }, "triggerWhatsAppIfEligible exécuté (voir logs Brevo pour le statut réel)");
    } catch (error) {
      failed++;
      logger.error({ effectifId, error }, "Exception lors du traitement");
    }
  }

  logger.info(
    { processed, skipped, failed, total },
    `Job terminé - Traités: ${processed}, Ignorés: ${skipped}, Exceptions: ${failed} sur ${total} éligibles`
  );

  return 0;
}
