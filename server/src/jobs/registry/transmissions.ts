import type { JobDef } from "job-processor";

import {
  computeDailyTransmissions,
  forceHydrateAllTransmissions,
  hydrateAllTransmissions,
} from "../hydrate/transmissions/hydrate-transmissions";

export const transmissionsJobs = {
  "hydrate:transmission-daily": {
    handler: computeDailyTransmissions,
  },
  "hydrate:transmissions-all": {
    handler: hydrateAllTransmissions,
  },
  "tmp:force-hydrate-transmissions": {
    handler: async () => {
      return forceHydrateAllTransmissions();
    },
  },
} satisfies Record<string, JobDef>;
