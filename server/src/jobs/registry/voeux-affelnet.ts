import type { JobDef } from "job-processor";

import { purgerVoeuxAffelnet } from "../clear/purge-voeux-affelnet";
import {
  hydrateVoeuxEffectifsDECARelations,
  hydrateVoeuxEffectifsRelations,
  hydrateAcademieInVoeux,
} from "../hydrate/affelnet/hydrate-voeux-effectifs";
import { seedSipaTestNancy } from "../tmp/seed-sipa-test-nancy";

import { payloadBoolean, payloadString } from "./payload";

export const voeuxAffelnetJobs = {
  "purge:voeux-affelnet": {
    handler: async (job) => purgerVoeuxAffelnet({ dryRun: payloadBoolean(job.payload, "dryRun") ?? false }),
  },
  "hydrate:voeux-effectifs-relations": {
    handler: async (job) => {
      const anneeScolaireRentree = payloadString(job.payload, "anneeScolaireRentree");
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
      const payload = job.payload as
        | { cleanup?: boolean; verify?: boolean; dryRun?: boolean; maj?: boolean }
        | undefined;
      return seedSipaTestNancy({
        cleanup: payload?.cleanup ?? false,
        verify: payload?.verify ?? false,
        dryRun: payload?.dryRun ?? false,
        maj: payload?.maj ?? false,
      });
    },
  },
} satisfies Record<string, JobDef>;
