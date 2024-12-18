import { z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

import { SourceApprenantEnum } from "shared/constants/effectifs";

import {
  zEffectifAnneeScolaire,
  zEffectifComputedOrganisme,
  zEffectifComputedStatut,
  zUsersMigration,
} from "../../data";
import { zApprenant } from "../../data/effectifs/apprenant.part";
import { zFormationEffectif } from "../../data/effectifs/formation.part";

export const zEffectifMissionLocale = z.object({
  _id: zObjectId,
  apprenant: zApprenant.pick({
    nom: true,
    prenom: true,
    date_de_naissance: true,
    adresse: true,
    telephone: true,
    courriel: true,
    rqth: true,
  }),
  statut: zEffectifComputedStatut,
  formation: zFormationEffectif,
  organisme: zEffectifComputedOrganisme,
  users: z.array(zUsersMigration.pick({ nom: true, prenom: true, email: true, telephone: true })),
  organisme_id: zObjectId,
  annee_scolaire: zEffectifAnneeScolaire,
  source: SourceApprenantEnum,
});

export type IEffecifMissionLocale = z.infer<typeof zEffectifMissionLocale>;
