import { addJob, type CronDef, type JobDef } from "job-processor";

import logger from "@/common/logger";
import { isWhatsAppReplyKind, WHATSAPP_REPLY_JOB } from "@/common/services/brevo/whatsapp/queue";
import config from "@/config";

import { sendWhatsAppInjoignables } from "../whatsapp/send-whatsapp-injoignables";
import { sendWhatsAppPrequalif } from "../whatsapp/send-whatsapp-prequalif";
import { sendWhatsAppReply } from "../whatsapp/send-whatsapp-reply";

import { payloadBoolean, payloadNumber, payloadString, requirePayloadString } from "./payload";

export const whatsappJobs = {
  "tmp:whatsapp:send-injoignables": {
    handler: async (job) => {
      const dryRun = payloadBoolean(job.payload, "dryRun") ?? false;
      const limit = payloadNumber(job.payload, "limit");
      return sendWhatsAppInjoignables({ dryRun, limit });
    },
  },
  // CLI manuel (sentVia="backfill") : J1-J5 du backfill — pas de notif individuelle YES
  "tmp:whatsapp:send-prequalif": {
    handler: async (job) => {
      const payload = job.payload as { dryRun?: boolean; limit?: number } | undefined;
      return sendWhatsAppPrequalif({
        dryRun: payload?.dryRun ?? false,
        limit: payload?.limit,
        sentVia: "backfill",
      });
    },
  },
  // Worker du cron 9h (sentVia="daily") : régime stable post-J5 — notif individuelle YES activée
  "whatsapp:send-prequalif-daily": {
    handler: async (job) => {
      const payload = job.payload as { limit?: number } | undefined;
      return sendWhatsAppPrequalif({ dryRun: false, limit: payload?.limit, sentVia: "daily" });
    },
  },
  // Réponses du webhook WhatsApp, enfilées hors du chemin HTTP ; se replanifie elle-même (cf. queue.ts)
  [WHATSAPP_REPLY_JOB]: {
    handler: async (job) => {
      const effectifId = requirePayloadString(job.payload, "effectifId");
      const kind = payloadString(job.payload, "kind");
      if (!isWhatsAppReplyKind(kind)) {
        throw new Error(`Type de réponse WhatsApp inconnu : ${kind}`);
      }
      return sendWhatsAppReply({ effectifId, kind, attempt: payloadNumber(job.payload, "attempt") ?? 1 });
    },
  },
} satisfies Record<string, JobDef>;

export const whatsappCrons = {
  // 18h30 Paris — mise en file de l'envoi WhatsApp préqualif quotidien (cap 500, kill-switch Brevo)
  // Mesuré sur 71 occurrences : attente max 19 min, durée max 0,04 s.
  "Envoi WhatsApp préqualif quotidien à 18h30": {
    cron_string: "30 18 * * *",
    checkinMargin: 30,
    maxRuntimeInMinutes: 5,
    handler: async () => {
      const PREQUALIF_DAILY_CRON_ENABLED = true;
      const PREQUALIF_DAILY_CRON_CAP = 500;
      if (!PREQUALIF_DAILY_CRON_ENABLED) {
        logger.info("PREQUALIF_DAILY_CRON_ENABLED=false, skip cron WhatsApp préqualif");
        return 0;
      }
      if (!config.brevo.whatsapp?.enabled) {
        logger.info("WhatsApp désactivé (kill-switch), skip cron WhatsApp préqualif");
        return 0;
      }
      await addJob({
        name: "whatsapp:send-prequalif-daily",
        payload: { limit: PREQUALIF_DAILY_CRON_CAP },
        queued: true,
      });
      return 0;
    },
  },
} satisfies Record<string, CronDef>;
