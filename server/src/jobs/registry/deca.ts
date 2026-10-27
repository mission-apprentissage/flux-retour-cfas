import type { CronDef, JobDef } from "job-processor";
import { ObjectId } from "mongodb";

import { flecherContratsDeca, idsDesSirets, rendreContratsDeca } from "@/common/actions/deca/deca-flechage.actions";
import { activerDecaOrganisme, retirerGardeActivationDeca } from "@/common/actions/organismes/organismes.admin.actions";
import logger from "@/common/logger";
import config from "@/config";

import { hydrateDecaRaw, hydrateDecaFromExistingEffectifs } from "../hydrate/deca/hydrate-deca-raw";

import { payloadBoolean, payloadNumber, payloadString, payloadStringArray, requirePayloadString } from "./payload";

export const decaJobs = {
  "hydrate:contrats-deca-raw": {
    handler: async (job) => {
      const dryRun = payloadBoolean(job.payload, "dryRun") ?? false;
      const limit = payloadNumber(job.payload, "limit");
      if (!dryRun && config.env !== "production") {
        logger.warn("hydrate:contrats-deca-raw job can only be run in production environment");
        return 0;
      }
      return hydrateDecaRaw({ dryRun, limit });
    },
  },
  "hydrate:mission-locale-from-deca": {
    handler: async () => {
      return hydrateDecaFromExistingEffectifs();
    },
  },
  "deca:activer": {
    handler: async (job) => {
      const organismeId = new ObjectId(requirePayloadString(job.payload, "organismeId"));
      try {
        const resultat = await activerDecaOrganisme(organismeId, { flecher: config.deca.flechageAuto });
        logger.info({ organismeId, resultat }, "deca:activer");
      } finally {
        await retirerGardeActivationDeca(organismeId);
      }
    },
  },
  "deca:flechage": {
    handler: async (job) => {
      const dryRun = payloadBoolean(job.payload, "dryRun") ?? false;
      const annuler = payloadBoolean(job.payload, "annuler") ?? false;
      const refaire = payloadBoolean(job.payload, "refaire") ?? false;
      const organisme = payloadString(job.payload, "organisme");
      const cible = payloadString(job.payload, "cible");
      const ids = async (siret: string) => {
        const organismeIds = await idsDesSirets([siret]);
        if (organismeIds.length === 0) throw new Error(`SIRET inconnu : ${siret}`);
        return organismeIds;
      };

      if (annuler && refaire) {
        throw new Error("--annuler et --refaire ne se combinent pas");
      }
      if (cible && (!refaire || organisme)) {
        throw new Error("--cible ne s'utilise qu'avec --refaire, sans --organisme");
      }
      if (annuler) {
        if (!organisme) throw new Error("--annuler exige --organisme");
        await rendreContratsDeca({ mode: "annuler", responsables: await ids(organisme), dryRun });
        return;
      }
      if (refaire) {
        await rendreContratsDeca({
          mode: "refaire",
          responsables: organisme ? await ids(organisme) : undefined,
          cibles: cible ? await ids(cible) : undefined,
          dryRun,
        });
        return;
      }
      await flecherContratsDeca({
        dryRun,
        perimetre: organisme ? await ids(organisme) : undefined,
        flagsSimules: await idsDesSirets(payloadStringArray(job.payload, "simulerFlag")),
      });
    },
  },
} satisfies Record<string, JobDef>;

export const decaCrons = {
  // 19h00 Paris le dimanche — import hebdomadaire des contrats DECA bruts (production uniquement).
  //
  // L'import dure 6h30 en moyenne et occupe le worker, qui est séquentiel et unique.
  // À 10h30 il entrait en collision avec le récap quotidien des CFA, planifié à la même
  // minute : chaque dimanche, CFA et Missions Locales recevaient leur récap vers 17h00
  // au lieu de 10h30 et 13h30.
  //
  // 19h00 est le seul créneau qui convienne : après l'envoi WhatsApp de 18h30, et assez
  // tôt pour finir avant le batch quotidien de 2h30.
  //
  // Mesuré sur 13 occurrences : durée moyenne 388 min, max 411 min.
  "hydrate:contrats-deca-raw": {
    cron_string: "0 19 * * 7",
    checkinMargin: 15,
    maxRuntimeInMinutes: 825,
    handler: async () => {
      if (config.env !== "production") {
        logger.warn("hydrate:contrats-deca-raw job can only be run in production environment");
        return 0;
      }
      return hydrateDecaRaw();
    },
  },
} satisfies Record<string, CronDef>;
