import { Jsonify } from "type-fest";
import { z } from "zod";

import { IModelDescriptor, zObjectId } from "./common";

const collectionName = "jobs" as const;

const indexes: IModelDescriptor["indexes"] = [
  [{ type: 1, scheduled_for: 1 }, { name: "type_scheduled_for" }],
  [{ type: 1, status: 1, scheduled_for: 1 }, { name: "type_status_scheduled_for" }],
  [{ ended_at: 1 }, { expireAfterSeconds: 3600 * 24 * 90 }], // 3 mois
];

export const ZJob = z
  .object({
    _id: zObjectId,
    name: z.string().describe("Le nom de la tâche"),
    type: z.enum(["simple", "cron", "cron_task"]).describe("Type du job simple ou cron"),
    status: z
      .enum(["pending", "will_start", "running", "finished", "blocked", "errored"])
      .describe("Statut courant du job"),
    sync: z.boolean().optional().describe("Si le job est synchrone"),
    payload: z.record(z.unknown()).optional().describe("La donnée liéé à la tâche"),
    output: z.record(z.unknown()).optional().describe("Les valeurs de retours du job"),
    cron_string: z.string().optional().describe("standard cron string exemple: '*/2 * * * *'"),
    scheduled_for: z.date().describe("Date de lancement programmée"),
    started_at: z.date().optional().describe("Date de lancement"),
    ended_at: z.date().optional().describe("Date de fin d'execution"),
    updated_at: z.date().optional().describe("Date de mise à jour en base de données"),
    created_at: z.date().optional().describe("Date d'ajout en base de données"),
  })
  .strict();

export type IJob = z.output<typeof ZJob>;
export type IJobJson = Jsonify<z.input<typeof ZJob>>;

export default {
  zod: ZJob,
  indexes,
  collectionName,
};
