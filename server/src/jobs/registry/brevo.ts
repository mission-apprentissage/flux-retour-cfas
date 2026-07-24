import { addJob, type CronDef, type JobDef } from "job-processor";

import { syncContactList, syncSingleContact } from "@/common/actions/brevo/contacts/sync";
import { isBrevoDailyFullSyncActive } from "@/common/actions/brevo/contacts/sync-settings.actions";
import { trackBrevoEvent } from "@/common/actions/brevo/events/track";
import logger from "@/common/logger";

export const brevoJobs = {
  "brevo-contacts:sync": {
    handler: async (job) => {
      const payload = job.payload as
        | {
            slug?: string;
            dryRun?: boolean;
            dumpTo?: string;
          }
        | undefined;
      if (!payload?.slug) {
        throw new Error("slug est requis");
      }
      const result = await syncContactList({
        slug: payload.slug,
        dryRun: payload.dryRun ?? false,
        dumpTo: payload.dumpTo,
      });
      logger.info({ contactList: payload.slug, ...result }, "Brevo contact list sync done");
      return result;
    },
  },
  "brevo-contacts:sync-one": {
    handler: async (job) => {
      const payload = job.payload as { userId?: string } | undefined;
      if (!payload?.userId) {
        throw new Error("userId est requis");
      }
      const result = await syncSingleContact(payload.userId);
      if (result) {
        logger.info({ userId: payload.userId, ...result }, "Brevo single contact sync done");
      }
      return result;
    },
  },
  "brevo-events:track": {
    handler: async (job) => {
      const payload = job.payload as { key?: string; userId?: string } | undefined;
      if (!payload?.key || !payload?.userId) {
        throw new Error("key et userId sont requis");
      }
      await trackBrevoEvent(payload.key, { userId: payload.userId });
      return { key: payload.key, userId: payload.userId };
    },
  },
} satisfies Record<string, JobDef>;

export const brevoCrons = {
  // 05h00 Paris — synchro complète des contacts TBA vers Brevo (si le toggle daily full sync est actif)
  "Synchro Brevo de tous les contacts TBA à 5h": {
    cron_string: "0 5 * * *",
    handler: async () => {
      if (!(await isBrevoDailyFullSyncActive())) {
        logger.info("Brevo daily full sync désactivé (toggle/hors prod), skip cron sync full");
        return 0;
      }
      await addJob({ name: "brevo-contacts:sync", payload: { slug: "tba-contacts" }, queued: true });
      return 0;
    },
  },
} satisfies Record<string, CronDef>;
