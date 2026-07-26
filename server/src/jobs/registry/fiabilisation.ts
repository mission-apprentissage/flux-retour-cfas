import type { JobDef } from "job-processor";

import { transformSansContratsToAbandonsDepuis, transformRupturantsToAbandonsDepuis } from "../fiabilisation/effectifs";
import { hydrateRaisonSocialeEtEnseigneOFAInconnus } from "../fiabilisation/ofa-inconnus";
import { updateOrganismesFiabilisationStatut } from "../fiabilisation/uai-siret/updateFiabilisation";

export const fiabilisationJobs = {
  "fiabilisation:uai-siret:run": {
    handler: updateOrganismesFiabilisationStatut,
  },
  "fiabilisation:effectifs:transform-inscritsSansContrats-en-abandons-depuis": {
    handler: async (job) => {
      return transformSansContratsToAbandonsDepuis((job.payload as any)?.nbJours);
    },
  },
  "fiabilisation:effectifs:transform-rupturants-en-abandons-depuis": {
    handler: async (job) => transformRupturantsToAbandonsDepuis((job.payload as any)?.nbJours),
  },
  "hydrate:ofa-inconnus": {
    handler: async () => {
      return hydrateRaisonSocialeEtEnseigneOFAInconnus();
    },
  },
} satisfies Record<string, JobDef>;
