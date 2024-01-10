import { objectOrNull, string } from "shared";

export const contratsDecaRuptureSchema = objectOrNull({
  dateEffetRupture: string({ description: "La date d'effet de la rupture" }),
});
