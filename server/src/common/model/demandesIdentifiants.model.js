import { object, string, date, objectId } from "./json-schema/jsonSchemaTypes";

export const collectionName = "demandesIdentifiants";

export const schema = object({
  _id: objectId(),
  profil: string(),
  region: string(),
  email: string(),
  created_at: date(),
});
