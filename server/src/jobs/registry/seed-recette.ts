import type { JobDef } from "job-processor";

import { seedRecette } from "../seed-recette/seed-recette";

export const seedRecetteJobs = {
  "seed:recette": {
    handler: async (job) => {
      const payload = job.payload as { dryRun?: boolean; uninstall?: boolean } | undefined;
      return seedRecette({ dryRun: payload?.dryRun ?? false, uninstall: payload?.uninstall ?? false });
    },
  },
} satisfies Record<string, JobDef>;
