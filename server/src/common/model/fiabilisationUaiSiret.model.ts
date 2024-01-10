import { STATUT_FIABILISATION_COUPLES_UAI_SIRET, object, date, objectId, string, stringOrNull } from "shared";

const collectionName = "fiabilisationUaiSiret";

const schema = object({
  _id: objectId(),
  created_at: date(),
  type: string({
    description: "Statut de fiabilisation du couple UAI SIRET",
    enum: Object.values(STATUT_FIABILISATION_COUPLES_UAI_SIRET),
  }),
  uai: string({ description: "L'UAI du couple à fiabiliser" }),
  siret: stringOrNull({ description: "Le SIRET du couple à fiabiliser" }),
  uai_fiable: string({ description: "L'UAI fiable lié au couple à fiabiliser" }),
  siret_fiable: string({ description: "Le SIRET fiable lié au couple à fiabiliser" }),
});

export default { schema, collectionName, indexes: [] };
