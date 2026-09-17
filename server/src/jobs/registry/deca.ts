import type { CronDef, JobDef } from "job-processor";

import logger from "@/common/logger";
import config from "@/config";

import { hydrateDecaRaw, hydrateDecaFromExistingEffectifs } from "../hydrate/deca/hydrate-deca-raw";

export const decaJobs = {
  "hydrate:contrats-deca-raw": {
    handler: async () => {
      if (config.env !== "production") {
        logger.warn("hydrate:contrats-deca-raw job can only be run in production environment");
        return 0;
      }
      return hydrateDecaRaw();
    },
  },
  "hydrate:mission-locale-from-deca": {
    handler: async () => {
      return hydrateDecaFromExistingEffectifs();
    },
  },
} satisfies Record<string, JobDef>;

export const decaCrons = {
  // 10h30 Paris le dimanche — import hebdomadaire des contrats DECA bruts (production uniquement)
  "hydrate:contrats-deca-raw": {
    cron_string: "30 10 * * 7",
    handler: async () => {
      if (config.env !== "production") {
        logger.warn("hydrate:contrats-deca-raw job can only be run in production environment");
        return 0;
      }
      return hydrateDecaRaw();
    },
  },
} satisfies Record<string, CronDef>;
