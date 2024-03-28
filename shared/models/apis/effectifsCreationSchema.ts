import { z } from "zod";

import { zApprenant } from "shared/models/data/effectifs/apprenant.part";
import { zContrat } from "shared/models/data/effectifs/contrat.part";
import { zFormationEffectif } from "shared/models/data/effectifs/formation.part";
import { primitivesV1, primitivesV3 } from "shared/models/data/zodPrimitives";

export const effectifCreationSchema = z.object({
  annee_scolaire: primitivesV1.formation.annee_scolaire,
  apprenant: zApprenant.omit({ historique_statut: true }),
  contrats: z.array(zContrat),
  formation: zFormationEffectif,
  organisme: z.object({
    organisme_responsable_id: z.string(),
    organisme_formateur_id: z.string(),
    organisme_lieu_id: z.string(),
    type_cfa: primitivesV3.type_cfa,
  }),
});

export type IEffectifCreationSchema = z.output<typeof effectifCreationSchema>;
