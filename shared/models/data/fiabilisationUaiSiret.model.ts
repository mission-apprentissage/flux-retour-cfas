import { z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

import { STATUT_FIABILISATION_COUPLES_UAI_SIRET } from "../../constants";
import { zodEnumFromObjValues } from "../../utils/zodHelper";

const collectionName = "fiabilisationUaiSiret";

const zFiabilisationUaiSiret = z.object({
  _id: zObjectId,
  created_at: z.date().nullish(),
  type: zodEnumFromObjValues(STATUT_FIABILISATION_COUPLES_UAI_SIRET)
    .describe("Statut de fiabilisation du couple UAI SIRET")
    .nullish(),
  uai: z.string({ description: "L'UAI du couple à fiabiliser" }).nullish(),
  siret: z.string({ description: "Le SIRET du couple à fiabiliser" }).nullish(),
  uai_fiable: z.string({ description: "L'UAI fiable lié au couple à fiabiliser" }).nullish(),
  siret_fiable: z.string({ description: "Le SIRET fiable lié au couple à fiabiliser" }).nullish(),
  rule_ids: z.array(z.number()).nullish(),
});

export default { zod: zFiabilisationUaiSiret, collectionName, indexes: [] };
