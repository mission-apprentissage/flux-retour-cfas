import type { JobDef } from "job-processor";

import { computeDailyTransmissions } from "../hydrate/transmissions/hydrate-transmissions";

import { payloadString } from "./payload";

export const transmissionsJobs = {
  "hydrate:transmission-daily": {
    handler: async (job) => computeDailyTransmissions({ day: payloadString(job.payload, "day") }),
  },
} satisfies Record<string, JobDef>;
