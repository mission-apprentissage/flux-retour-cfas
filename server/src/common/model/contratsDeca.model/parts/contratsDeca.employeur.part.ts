import { object, string } from "../../json-schema/jsonSchemaTypes";

export const contratsDecaEmployeurSchema = object(
  {
    codeIdcc: string({ description: "Le code IDCC de l'employeur" }),
  },
  {
    required: ["codeIdcc"],
  }
);
