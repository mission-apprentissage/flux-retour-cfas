import { ObjectId } from "mongodb";

import { CONTACT_OPPORTUN_SCORE_THRESHOLD } from "@/common/actions/mission-locale/mission-locale.constants";
import parentLogger from "@/common/logger";
import { missionLocaleEffectifsDb, organisationsDb } from "@/common/model/collections";
import { isEligibleForPrequalif } from "@/common/services/brevo/whatsapp/eligibility";
import { normalizePhoneNumber } from "@/common/services/brevo/whatsapp/phone";
import { reserveAndSendPrequalif, type PrequalifSentVia } from "@/common/services/brevo/whatsapp/prequalif";
import { sleep } from "@/common/utils/asyncUtils";
import config from "@/config";

const logger = parentLogger.child({ module: "job:whatsapp:send-prequalif" });

const BATCH_SIZE = 500;
const PAUSE_BETWEEN_BATCHES_MS = 1000;
const RETRY_FAILED_AFTER_MS = 60 * 60 * 1000;

interface SendOptions {
  dryRun: boolean;
  limit?: number;
  sentVia: PrequalifSentVia;
}

interface EligibleRow {
  _id: ObjectId;
}

/**
 * Effectifs candidats à un envoi préqualif. Filtre score ≥ 0.75, exclusions
 * CFA V2 + acc_conjoint + opt-out + soft-deleted, et capture les `failed_send`.
 */
async function getEligibleEffectifs(): Promise<EligibleRow[]> {
  const failedRetryThreshold = new Date(Date.now() - RETRY_FAILED_AFTER_MS);
  return missionLocaleEffectifsDb()
    .aggregate<EligibleRow>([
      {
        $match: {
          "classification_reponse_appel.score": { $gte: CONTACT_OPPORTUN_SCORE_THRESHOLD },
          situation: null,
          soft_deleted: { $ne: true },
          "computed.organisme.is_allowed_collab": { $ne: true },
          "organisme_data.acc_conjoint": { $ne: true },
          "whatsapp_contact.opted_out": { $ne: true },
          $or: [
            { whatsapp_contact: { $exists: false } },
            { "whatsapp_contact.last_message_sent_at": { $exists: false } },
            {
              "whatsapp_contact.message_status": "failed_send",
              "whatsapp_contact.status_updated_at": { $lt: failedRetryThreshold },
            },
          ],
        },
      },
      { $project: { _id: 1 } },
    ])
    .toArray();
}

/**
 * Fonction partagée CLI (sentVia="backfill") ET cron quotidien 9h (sentVia="daily").
 *
 * Le `sentVia` est l'unique différence comportementale : il conditionne l'envoi de la
 * notif individuelle ML au moment d'un éventuel YES :
 *   - backfill : pas de notif
 *   - daily    : notif activée
 *
 */
export async function sendWhatsAppPrequalif({ dryRun, limit, sentVia }: SendOptions): Promise<number> {
  if (config.env !== "production") {
    logger.warn("whatsapp:send-prequalif can only be run in production environment");
    return 0;
  }

  logger.info({ dryRun, limit, sentVia }, "Début du job whatsapp:send-prequalif");

  if (!config.brevo.whatsapp?.enabled) {
    logger.error("ABANDON : WhatsApp désactivé (MNA_TDB_WHATSAPP_ENABLED != true)");
    return 1;
  }
  if (!config.brevo.whatsapp?.templatePrequalifInitialId) {
    logger.error("ABANDON : Template préqualif initial non configuré");
    return 1;
  }

  if (!config.brevo.whatsapp?.templatePrequalifYesWithUrlId) {
    logger.error(
      "ABANDON : Template préqualif YES-with-URL non configuré (MNA_TDB_WHATSAPP_TEMPLATE_PREQUALIF_YES_WITH_URL_ID)"
    );
    return 1;
  }
  if (!config.brevo.apiKey) {
    logger.error("ABANDON : Clé API Brevo non configurée");
    return 1;
  }

  const allEligible = await getEligibleEffectifs();
  const target = limit ? allEligible.slice(0, limit) : allEligible;
  const total = target.length;

  logger.info(
    { total, totalEligible: allEligible.length, limit, dryRun, sentVia },
    `${total} effectifs à traiter (${allEligible.length} éligibles au total)`
  );

  if (dryRun) {
    logger.info({ total }, "Mode dry-run : aucun message envoyé");
    return 0;
  }
  if (total === 0) {
    return 0;
  }

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  // Cache nom ML : un envoi de 500 effectifs peut concerner < 30 ML distinctes.
  const mlNomCache = new Map<string, string>();
  const getMlNom = async (mlId: ObjectId): Promise<string> => {
    const key = mlId.toHexString();
    const cached = mlNomCache.get(key);
    if (cached !== undefined) return cached;
    const orga = await organisationsDb().findOne({ _id: mlId, type: "MISSION_LOCALE" }, { projection: { nom: 1 } });
    const nom = ((orga as { nom?: string } | null)?.nom ?? "").trim();
    mlNomCache.set(key, nom);
    return nom;
  };

  for (let i = 0; i < total; i++) {
    const { _id: effectifId } = target[i];

    try {
      const freshEffectif = await missionLocaleEffectifsDb().findOne({ _id: effectifId });
      if (!freshEffectif) {
        skipped++;
        continue;
      }
      if (!isEligibleForPrequalif(freshEffectif)) {
        skipped++;
        continue;
      }

      const targetPhone = normalizePhoneNumber(freshEffectif.effectif_snapshot?.apprenant?.telephone);
      if (!targetPhone) {
        skipped++;
        continue;
      }

      const mlNom = await getMlNom(freshEffectif.mission_locale_id);
      const result = await reserveAndSendPrequalif({
        effectifId,
        targetPhone,
        prenom: freshEffectif.effectif_snapshot?.apprenant?.prenom || "",
        mlNom,
        sentVia,
      });

      if (result === "sent") sent++;
      else if (result === "skipped") skipped++;
      else failed++;
    } catch (err) {
      failed++;
      logger.error({ effectifId, err }, "Exception lors du traitement préqualif");
    }

    if ((i + 1) % BATCH_SIZE === 0 && i + 1 < total) {
      logger.info({ progress: `${i + 1}/${total}` }, "Pause inter-batch");
      await sleep(PAUSE_BETWEEN_BATCHES_MS);
    }
  }

  logger.info({ sent, skipped, failed, total, sentVia }, "Job préqualif terminé");
  return 0;
}
