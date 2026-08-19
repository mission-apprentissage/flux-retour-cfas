import { addJob, type CronDef, type JobDef } from "job-processor";

const runDailyJobs = async (queued: boolean) => {
  // # Remplissage des formations issus du catalogue
  await addJob({ name: "hydrate:formations-catalogue", queued });

  await addJob({ name: "import:formation", queued });

  await addJob({ name: "import:formation", queued });

  // # Remplissage des organismes depuis le référentiel
  await addJob({ name: "hydrate:organismes", queued });

  await addJob({ name: "hydrate:organismes-organisations", queued });

  // # Mise à jour des relations
  await addJob({ name: "hydrate:organismes-relations", queued });

  // # Mise à jour du compteur de formations par organisme
  await addJob({ name: "hydrate:organismes-formations-count", queued });

  // # Remplissage des OPCOs
  await addJob({ name: "hydrate:opcos", queued });

  // # Remplissage des ofa inconnus
  await addJob({ name: "hydrate:ofa-inconnus", queued });

  // # Lancement des scripts de fiabilisation des couples UAI - SIRET
  await addJob({ name: "fiabilisation:uai-siret:run", queued });

  // # Mise à jour des niveaux des formations des effectifs
  await addJob({ name: "hydrate:effectifs-formation-niveaux", queued: true });

  // # Purge des collections events et queues
  await addJob({ name: "purge:queues", queued });

  // # Mise à jour du nb d'effectifs
  await addJob({ name: "hydrate:organismes-effectifs-count", queued });

  // # Fiabilisation des effectifs : transformation des inscrits sans contrats en abandon > 90 jours & transformation des rupturants en abandon > 180 jours
  await addJob({
    name: "fiabilisation:effectifs:transform-inscritsSansContrats-en-abandons-depuis",
    queued,
  });

  await addJob({ name: "fiabilisation:effectifs:transform-rupturants-en-abandons-depuis", queued });

  await addJob({ name: "hydrate:rncp", queued });

  await addJob({ name: "computed:update", queued });

  await addJob({ name: "organisme:cleanup", queued });

  await addJob({ name: "hydrate:transmission-daily", queued });

  return 0;
};

export const dailyJobs = {
  "init:dev": {
    handler: async () => runDailyJobs(false),
  },
  "hydrate:daily": {
    handler: async () => runDailyJobs(true),
  },
} satisfies Record<string, JobDef>;

export const dailyCrons = {
  // 02h30 Paris — enchaîne tous les jobs quotidiens (hydrate, fiabilisation, purge) en file
  "Run daily jobs each day at 02h30": {
    cron_string: "30 2 * * *",
    handler: async () => runDailyJobs(true),
  },
} satisfies Record<string, CronDef>;
