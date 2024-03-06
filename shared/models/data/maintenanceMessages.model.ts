import { z } from "zod";

const collectionName = "maintenanceMessages";

export const zMaintenanceMessage = z.object({
  _id: z.any(),
  msg: z.string({ description: "Message de maintenance" }),
  name: z.string({ description: "email du créateur du message" }),
  type: z.enum(["alert", "info"]),
  context: z.enum(["manuel", "automatique", "maintenance"]),
  time: z.date({ description: "Date de mise en place du message" }).optional(),
  enabled: z.boolean({ description: "Message actif ou non" }).optional(),
});

export type IMaintenanceMessage = z.output<typeof zMaintenanceMessage>;

export default { zod: zMaintenanceMessage, indexes: [], collectionName };
