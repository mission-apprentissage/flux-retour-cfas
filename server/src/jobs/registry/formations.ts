import type { CronDef, JobDef } from "job-processor";

import { hydrateFormationV2 } from "../hydrate/formations/hydrate-formation-v2";
import { hydrateFormationsCatalogue } from "../hydrate/hydrate-formations-catalogue";
import { hydrateRNCP } from "../hydrate/hydrate-rncp";

export const formationsJobs = {
  "import:formation": {
    handler: hydrateFormationV2,
  },
  "hydrate:formations-catalogue": {
    handler: async () => {
      return hydrateFormationsCatalogue();
    },
  },
  "hydrate:rncp": {
    handler: async () => {
      return hydrateRNCP();
    },
  },
} satisfies Record<string, JobDef>;

export const formationsCrons = {
  // 03h00 Paris — import quotidien des formations (formation v2)
  "Import formations": {
    cron_string: "0 3 * * *",
    handler: hydrateFormationV2,
  },
} satisfies Record<string, CronDef>;
