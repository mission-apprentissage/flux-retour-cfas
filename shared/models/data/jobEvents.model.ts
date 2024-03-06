import { z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

const collectionName = "jobEvents";

export const zJobEvent = z.object({
  _id: zObjectId,
  jobname: z.string({ description: "Le nom du job" }),
  date: z.date({ description: "La date de l'evenement" }),
  action: z.string({ description: "L'action en cours" }),
  data: z.object({}, { description: "La donnée liéé à l'action" }).passthrough().nullish(),
});

export default { zod: zJobEvent, collectionName, indexes: [] };
