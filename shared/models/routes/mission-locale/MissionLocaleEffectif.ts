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
import { zContrat } from "../../data/effectifs/contrat.part";

const zEffectifMissionLocale = z.object({
  id: zObjectId,
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
  contrat: zContrat.nullish(),
  organisme: zEffectifComputedOrganisme,
  users: z.array(zUsersMigration.pick({ nom: true, prenom: true, email: true, telephone: true, fonction: true })),
  organisme_id: zObjectId,
  annee_scolaire: zEffectifAnneeScolaire,
  source: SourceApprenantEnum,
});

export type IEffecifMissionLocale = z.infer<typeof zEffectifMissionLocale>;
