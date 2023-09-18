import { object, stringOrNull } from "../../json-schema/jsonSchemaTypes";

export const contratsDecaOrganismeFormationResponsableSchema = object({
  uaiCfa: stringOrNull({ description: "L'UAI de l'organisme responsable" }),
  siret: stringOrNull({ description: "Le SIRET de l'organisme responsable" }),
});
