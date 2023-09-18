import { object, stringOrNull } from "../../json-schema/jsonSchemaTypes";

export const contratsDecaEtablissementFormationSchema = object({
  siret: stringOrNull({ description: "Le siret de l'établissement de la formation" }),
});
