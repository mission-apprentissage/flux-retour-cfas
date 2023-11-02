import { z } from "zod";

import { IModelDescriptor, zObjectId } from "./common";

export const auditLogSchema = z
  .object({
    action: z.string().describe("L'action en cours"),
    date: z.date().describe("La date de l'évènement"),
    data: z.any().nullish().describe("La donnée liée à l'action"),
  })
  .strict();

export type IAuditLog = z.output<typeof auditLogSchema>;

export default {
  collectionName: "auditLogs",
  indexes: [],
  zod: auditLogSchema.merge(z.object({ _id: zObjectId })).strict(),
} as IModelDescriptor;
