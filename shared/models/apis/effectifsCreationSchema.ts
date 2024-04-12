import { z } from "zod";

import { zApprenant } from "shared/models/data/effectifs/apprenant.part";
import { zContrat } from "shared/models/data/effectifs/contrat.part";
import { zFormationEffectif } from "shared/models/data/effectifs/formation.part";
import { primitivesV1, primitivesV3 } from "shared/models/data/zodPrimitives";

export const effectifCreationCoordonnesSchema = z.object({
  apprenant: zApprenant.omit({ historique_statut: true }).nullish(),
});

export const effectifCreationFormationSchema = z.object({
  annee_scolaire: primitivesV1.formation.annee_scolaire.nullish(),
  formation: zFormationEffectif.nullish(),
  organisme: z
    .object({
      organisme_responsable_id: z.string(),
      organisme_formateur_id: z.string(),
      organisme_lieu_id: z.string(),
      type_cfa: primitivesV3.type_cfa,
    })
    .nullish(),
});

export const effectifCreationContratsSchema = z.object({
  contrats: z.array(zContrat).nullish(),
});

export const effectifCreationSchema = z.object({
  ...effectifCreationCoordonnesSchema.shape,
  ...effectifCreationFormationSchema.shape,
  ...effectifCreationContratsSchema.shape,
});

export const effectifCreationCoordonnesFormSchema = effectifCreationCoordonnesSchema.transform(({ apprenant }) => {
  return {
    apprenant: {
      ...apprenant,
      date_de_naissance: apprenant?.date_de_naissance?.toISOString().split("T")[0],
      date_rqth: apprenant?.date_rqth?.toISOString().split("T")[0],
    },
  };
});

export type IEffectifCreationSchema = z.output<typeof effectifCreationSchema>;

export type IEffectifCreationContratsSchema = z.output<typeof effectifCreationContratsSchema>;
export type IEffectifCreationFormationSchema = z.output<typeof effectifCreationFormationSchema>;
export type IEffectifCreationCoordonnesSchema = z.output<typeof effectifCreationCoordonnesSchema>;

export type IEffectifCreationCoordonnesFormSchema = z.output<typeof effectifCreationCoordonnesFormSchema>;
