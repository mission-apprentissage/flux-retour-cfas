import { FIABILISATION_TYPES } from "../../constants/fiabilisationConstants.js";
import { object, date, objectId, string, stringOrNull } from "../json-schema/jsonSchemaTypes.js";

export const collectionName = "fiabilisationUaiSiret";

const schema = object({
  _id: objectId(),
  created_at: date(),
  type: string({
    description: "Type de fiabilisation",
    enum: Object.values(FIABILISATION_TYPES),
  }),
  uai: string({ description: "L'UAI du couple à fiabiliser" }),
  siret: stringOrNull({ description: "Le SIRET du couple à fiabiliser" }),
  uai_fiable: string({ description: "L'UAI fiable lié au couple à fiabiliser" }),
  siret_fiable: string({ description: "Le SIRET fiable lié au couple à fiabiliser" }),
});

export default { schema, collectionName };
