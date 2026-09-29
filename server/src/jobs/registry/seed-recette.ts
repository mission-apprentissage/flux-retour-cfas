import type { CronDef, JobDef } from "job-processor";

import config from "@/config";

import { seedRecette } from "../seed-recette/seed-recette";

export const seedRecetteJobs = {
  "seed:recette": {
    handler: async (job) => {
      const payload = job.payload as { dryRun?: boolean; uninstall?: boolean } | undefined;
      return seedRecette({ dryRun: payload?.dryRun ?? false, uninstall: payload?.uninstall ?? false });
    },
  },
} satisfies Record<string, JobDef>;

export function buildSeedRecetteCrons(env: string): Record<string, CronDef> {
  if (env !== "recette") {
    return {};
  }
  return {
    // 05h00 Paris, recette uniquement — après hydrate:daily (02h30) et la purge ML (04h30)
    "Régénère le jeu de données fictif de recette à 5h": {
      cron_string: "0 5 * * *",
      handler: async () => seedRecette(),
    },
  };
}

export const seedRecetteCrons = buildSeedRecetteCrons(config.env);
