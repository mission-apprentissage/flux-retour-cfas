import { object, string } from "shared";

export const contratsDecaEmployeurSchema = object(
  {
    codeIdcc: string({ description: "Le code IDCC de l'employeur" }),
  },
  {
    required: ["codeIdcc"],
  }
);