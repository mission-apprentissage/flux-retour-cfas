import type { JobDef } from "job-processor";

import {
  hydrateVoeuxEffectifsDECARelations,
  hydrateVoeuxEffectifsRelations,
  hydrateAcademieInVoeux,
} from "../hydrate/affelnet/hydrate-voeux-effectifs";

export const voeuxAffelnetJobs = {
  "hydrate:voeux-effectifs-relations": {
    handler: async (job) => {
      const anneeScolaireRentree = (job.payload as any)?.anneeScolaireRentree as string | undefined;
      await hydrateVoeuxEffectifsRelations(anneeScolaireRentree);
      await hydrateVoeuxEffectifsDECARelations(anneeScolaireRentree);
      return;
    },
  },
  "hydrate:voeux-academie-code": {
    handler: async () => {
      await hydrateAcademieInVoeux();
    },
  },
} satisfies Record<string, JobDef>;
