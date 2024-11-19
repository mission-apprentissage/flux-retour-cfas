import { z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

import { IModelDescriptor } from "./common";

const auditLogSchema = z
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
  zod: auditLogSchema.extend({ _id: zObjectId }).strict(),
} as IModelDescriptor;
