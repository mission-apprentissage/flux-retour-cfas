import { object, string, date, objectId } from "shared";

const collectionName = "jobEvents";

const schema = object(
  {
    _id: objectId(),
    jobname: string({ description: "Le nom du job" }),
    date: date({ description: "La date de l'evenement" }),
    action: string({ description: "L'action en cours" }),
    data: object({}, { additionalProperties: true, description: "La donnée liéé à l'action" }),
  },
  { required: ["jobname", "action", "date"] }
);

export default { schema, collectionName, indexes: [] };
