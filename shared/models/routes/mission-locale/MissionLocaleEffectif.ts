import { z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

import { zEffectif, zEffectifComputedStatut } from "../../data";
import { zApprenant } from "../../data/effectifs/apprenant.part";
import { zFormationEffectif } from "../../data/effectifs/formation.part";

const zEffectifMissionLocale = z.object({
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
});
