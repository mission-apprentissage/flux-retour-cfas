import type { JobDef } from "job-processor";

import {
  hydrateVoeuxEffectifsDECARelations,
  hydrateVoeuxEffectifsRelations,
  hydrateAcademieInVoeux,
} from "../hydrate/affelnet/hydrate-voeux-effectifs";
import { seedSipaTestNancy } from "../tmp/seed-sipa-test-nancy";

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
  "tmp:seed-sipa-test-nancy": {
    handler: async (job) => {
      const payload = job.payload as { cleanup?: boolean; verify?: boolean; dryRun?: boolean } | undefined;
      return seedSipaTestNancy({
        cleanup: payload?.cleanup ?? false,
        verify: payload?.verify ?? false,
        dryRun: payload?.dryRun ?? false,
      });
    },
  },
} satisfies Record<string, JobDef>;
