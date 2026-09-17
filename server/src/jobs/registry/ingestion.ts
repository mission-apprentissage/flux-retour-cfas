import type { JobDef } from "job-processor";
import { ObjectId } from "mongodb";

import { purgeQueues } from "../clear/purge-queues";
import { updateEffectifQueueDateAndError } from "../ingestion/migration/effectif-queue";
import { removeDuplicatesEffectifsQueue } from "../ingestion/process-effectifs-queue-remove-duplicates";
import { processEffectifQueueById, processEffectifsQueue } from "../ingestion/process-ingestion";
import { migrateEffectifs } from "../ingestion/process-ingestion.v2";

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
  "tmp:migrate:effectifs": {
    handler: migrateEffectifs,
  },
  "tmp:migrate:effectifs-queue": {
    handler: updateEffectifQueueDateAndError,
  },
} satisfies Record<string, JobDef>;
