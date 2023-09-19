import { objectOrNull, string } from "../../json-schema/jsonSchemaTypes";

export const contratsDecaRuptureSchema = objectOrNull({
  dateEffetRupture: string({ description: "La date d'effet de la rupture" }),
});
