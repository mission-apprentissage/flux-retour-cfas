import { object, stringOrNull } from "shared";

export const contratsDecaEtablissementFormationSchema = object({
  siret: stringOrNull({ description: "Le siret de l'établissement de la formation" }),
});
