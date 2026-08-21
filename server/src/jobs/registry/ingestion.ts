import type { JobDef } from "job-processor";

import { purgeQueues } from "../clear/purge-queues";
import { updateEffectifQueueDateAndError } from "../ingestion/migration/effectif-queue";
import { removeDuplicatesEffectifsQueue } from "../ingestion/process-effectifs-queue-remove-duplicates";
import { processEffectifQueueById, processEffectifsQueue } from "../ingestion/process-ingestion";
import { migrateEffectifs } from "../ingestion/process-ingestion.v2";

export const ingestionJobs = {
  "process:effectifs-queue:remove-duplicates": {
    handler: async () => {
      return removeDuplicatesEffectifsQueue();
    },
  },
  "process:effectifs-queue:single": {
    handler: async (job) => {
      return processEffectifQueueById((job.payload as any)?.id);
    },
  },
  "process:effectifs-queue": {
    handler: async (job) => {
      return processEffectifsQueue(job.payload as any);
    },
  },
  "purge:queues": {
    handler: async (job) => {
      return purgeQueues((job.payload as any)?.nbDaysToKeep);
    },
  },
  "tmp:migrate:effectifs": {
    handler: migrateEffectifs,
  },
  "tmp:migrate:effectifs-queue": {
    handler: updateEffectifQueueDateAndError,
  },
} satisfies Record<string, JobDef>;
