import { addJob, type CronDef, type JobDef } from "job-processor";

import { sendCfaDailyRecap } from "../emails/cfa-daily-recap";
import { sendMissionLocaleDailyRecap } from "../emails/mission-locale-daily-recap";
import { sendMissionLocaleWeeklyRecap } from "../emails/mission-locale-weekly-recap";

export const emailsJobs = {
  /*"send-reminder-emails": {
    handler: async () => {
      return sendReminderEmails();
    },
  },*/
  "send-mission-locale-weekly-recap": {
    handler: async () => {
      return sendMissionLocaleWeeklyRecap();
    },
  },
  "send-mission-locale-daily-recap": {
    handler: async () => {
      return sendMissionLocaleDailyRecap();
    },
  },
  "send-cfa-daily-recap": {
    handler: async () => {
      return sendCfaDailyRecap();
    },
  },
} satisfies Record<string, JobDef>;

export const emailsCrons = {
  // 07h00 Paris — mise en file des emails de relance
  "Send reminder emails at 7h": {
    cron_string: "0 7 * * *",
    handler: async () => {
      await addJob({ name: "send-reminder-emails", queued: true });
      return 0;
    },
  },
  // 14h30 Paris le lundi — récap hebdomadaire envoyé aux Missions Locales
  "Send ML weekly recap at 14h30 on Mondays": {
    cron_string: "30 14 * * 1",
    handler: async () => {
      await addJob({ name: "send-mission-locale-weekly-recap", queued: true });
      return 0;
    },
  },
  // 13h30 Paris — récap quotidien envoyé aux Missions Locales
  "Send ML daily recap at 13h30": {
    cron_string: "30 13 * * *",
    handler: async () => {
      await addJob({ name: "send-mission-locale-daily-recap", queued: true });
      return 0;
    },
  },
  // 10h30 Paris — récap quotidien envoyé aux CFA
  "Send CFA daily recap at 10h30": {
    cron_string: "30 10 * * *",
    handler: async () => {
      await addJob({ name: "send-cfa-daily-recap", queued: true });
      return 0;
    },
  },
} satisfies Record<string, CronDef>;
