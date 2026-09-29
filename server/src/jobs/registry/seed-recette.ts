import { captureException } from "@sentry/node";
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
    // 05h30 Paris, recette uniquement — après hydrate:daily (02h30), la purge ML (04h30) et le job des statuts du samedi (05h00)
    "Régénère le jeu de données fictif de recette à 5h30": {
      cron_string: "30 5 * * *",
      handler: async () => {
        try {
          return await seedRecette();
        } catch (error) {
          captureException(error);
          throw error;
        }
      },
    },
  };
}

export const seedRecetteCrons = buildSeedRecetteCrons(config.env);
