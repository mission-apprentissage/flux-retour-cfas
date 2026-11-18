import { z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

import { IModelDescriptor, SIX_MOIS_EN_SECONDES } from "./common";

const auditLogSchema = z
  .object({
    action: z.string().describe("L'action en cours"),
    date: z.date().describe("La date de l'évènement"),
    data: z.unknown().nullish().describe("La donnée liée à l'action"),
  })
  .strict();

export type IAuditLog = z.output<typeof auditLogSchema>;

export default {
  collectionName: "auditLogs",
  indexes: [[{ date: 1 }, { name: "ttl_date", expireAfterSeconds: SIX_MOIS_EN_SECONDES }]],
  zod: auditLogSchema.extend({ _id: zObjectId }).strict(),
} as IModelDescriptor;
