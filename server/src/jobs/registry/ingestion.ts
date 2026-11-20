import type { CronDef, JobDef } from "job-processor";
import { ObjectId } from "mongodb";

import config from "@/config";

import { purgeOrphanQueues, purgeQueues } from "../clear/purge-queues";
import { purgeTraces } from "../clear/purge-traces";
import { heartbeatIngestion } from "../ingestion/heartbeat-ingestion";
import { removeDuplicatesEffectifsQueue } from "../ingestion/process-effectifs-queue-remove-duplicates";
import { processEffectifQueueById, processEffectifsQueue } from "../ingestion/process-ingestion";
import { mesurerPerimetreTeleversement } from "../tmp/mesurer-perimetre-televersement";

import { payloadBoolean, payloadDate, payloadNumber, requirePayloadString } from "./payload";

export const ingestionJobs = {
  "process:effectifs-queue:remove-duplicates": {
    handler: async () => {
      return removeDuplicatesEffectifsQueue();
    },
  },
  "process:effectifs-queue:single": {
    handler: async (job) => {
      return processEffectifQueueById(new ObjectId(requirePayloadString(job.payload, "id")));
    },
  },
  "process:effectifs-queue": {
    handler: async (job) => {
      return processEffectifsQueue({
        force: payloadBoolean(job.payload, "force"),
        limit: payloadNumber(job.payload, "limit"),
        since: payloadDate(job.payload, "since"),
      });
    },
  },
  "purge:queues": {
    handler: async (job) => {
      return purgeQueues(payloadNumber(job.payload, "nbDaysToKeep"));
    },
  },
  "purge:traces": {
    handler: async () => purgeTraces(new Date(), { simulation: !config.purgeTracesActive }),
  },
  "clear:queue-orphans": {
    handler: async (job) => {
      return purgeOrphanQueues({
        nbDaysToKeep: payloadNumber(job.payload, "nbDaysToKeep"),
        batchSize: payloadNumber(job.payload, "batchSize"),
        sleepMs: payloadNumber(job.payload, "sleepMs"),
      });
    },
  },
  "tmp:mesurer-perimetre-televersement": {
    handler: async (job) => mesurerPerimetreTeleversement({ mois: payloadNumber(job.payload, "mois") }),
  },
  "heartbeat:ingestion": {
    handler: heartbeatIngestion,
  },
} satisfies Record<string, JobDef>;

export const ingestionCrons = {
  // Toutes les 15 minutes — détecte une file d'ingestion qui n'avance plus.
  //
  // La marge est large parce que ce cron partage le worker avec le batch de 02h30 :
  // entre 02h30 et 04h27, il ne s'exécute pas. L'ingestion, elle, tourne sur le
  // queue_processor et n'est pas bloquée — seule sa surveillance l'est.
  "Vérifie que l'ingestion avance toutes les 15 min": {
    cron_string: "*/15 * * * *",
    checkinMargin: 120,
    maxRuntimeInMinutes: 10,
    handler: heartbeatIngestion,
  },
} satisfies Record<string, CronDef>;
