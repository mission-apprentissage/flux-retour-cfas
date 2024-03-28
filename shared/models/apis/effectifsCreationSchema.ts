import { z } from "zod";

import { zApprenant } from "shared/models/data/effectifs/apprenant.part";
import { zContrat } from "shared/models/data/effectifs/contrat.part";
import { zFormationEffectif } from "shared/models/data/effectifs/formation.part";
import { primitivesV1, primitivesV3 } from "shared/models/data/zodPrimitives";

export const effectifCreationCoordonnesSchema = z.object({
  apprenant: zApprenant.omit({ historique_statut: true }),
});

export const effectifCreationFormationSchema = z.object({
  annee_scolaire: primitivesV1.formation.annee_scolaire,
  formation: zFormationEffectif,
  organisme: z.object({
    organisme_responsable_id: z.string(),
    organisme_formateur_id: z.string(),
    organisme_lieu_id: z.string(),
    type_cfa: primitivesV3.type_cfa,
  }),
});

export const effectifCreationContratsSchema = z.object({
  contrats: z.array(zContrat),
});

export const effectifCreationSchema = z.object({
  ...effectifCreationCoordonnesSchema.shape,
  ...effectifCreationFormationSchema.shape,
  ...effectifCreationContratsSchema.shape,
});

export type IEffectifCreationSchema = z.output<typeof effectifCreationSchema>;

export type IEffectifCreationContratsSchema = z.output<typeof effectifCreationContratsSchema>;
export type IEffectifCreationFormationSchema = z.output<typeof effectifCreationFormationSchema>;
export type IEffectifCreationCoordonnesSchema = z.output<typeof effectifCreationCoordonnesSchema>;
