import { CreateIndexesOptions, IndexSpecification, ObjectId } from "mongodb";
import { date, object, objectId, string } from "shared";

const collectionName = "invitations";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [
  [{ token: 1 }, { name: "token", unique: true }],
  [{ organisation_id: 1 }, { name: "organisation_id" }],
];

export interface Invitation {
  token: string;
  email: string;
  organisation_id: ObjectId;
  author_id: ObjectId;
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
    author_id: objectId({
      description: "Auteur de l'invitation",
    }),
    created_at: date({ description: "Date de création en base de données" }),
  },
  { required: ["token", "email", "organisation_id", "author_id", "created_at"], additionalProperties: true }
);

export default { schema, indexes, collectionName };
