import type { JobDef } from "job-processor";

import { computeDailyTransmissions } from "../hydrate/transmissions/hydrate-transmissions";

export const transmissionsJobs = {
  "hydrate:transmission-daily": {
    handler: computeDailyTransmissions,
  },
} satisfies Record<string, JobDef>;
