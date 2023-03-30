import { ObjectId } from "mongodb";
import { date, object, objectId, string } from "./json-schema/jsonSchemaTypes.js";

const collectionName = "invitations";

// FIXME compléter si besoin d'indexes
const indexes = [];

export interface Invitation {
  token: string;
  email: string;
  organisation_id: ObjectId;
  created_at: Date;
}

const schema = object(
  {
    _id: objectId(),
    token: string({ description: "Jeton d'invitation" }),
    email: string({ description: "Email destinataire" }),
    organisation_id: objectId({
      description: "Organisation cible de l'invitation",
    }),
    created_at: date({ description: "Date de création en base de données" }),
  },
  { required: ["token", "email", "organisation_id"], additionalProperties: true }
);

export default { schema, indexes, collectionName };
