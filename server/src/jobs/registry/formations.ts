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
  // 04h40 Paris — import quotidien des formations (formation v2).
  // Déplacé de 03h00 : il attendait 78 min derrière la file du batch de 02h30.
  // Mesuré sur 90 j : durée max 5,0 min.
  "Import formations": {
    cron_string: "40 4 * * *",
    checkinMargin: 15,
    maxRuntimeInMinutes: 15,
    handler: hydrateFormationV2,
  },
} satisfies Record<string, CronDef>;
