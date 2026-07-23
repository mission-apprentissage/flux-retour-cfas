import type { CronDef, JobDef } from "job-processor";

import { brevoCrons, brevoJobs } from "./brevo";
import { dailyCrons, dailyJobs } from "./daily";
import { dbMaintenanceJobs } from "./db-maintenance";
import { decaCrons, decaJobs } from "./deca";
import { diversCrons, diversJobs } from "./divers";
import { effectifsCrons, effectifsJobs } from "./effectifs";
import { emailsCrons, emailsJobs } from "./emails";
import { fiabilisationJobs } from "./fiabilisation";
import { formationsCrons, formationsJobs } from "./formations";
import { ingestionJobs } from "./ingestion";
import { missionLocaleCrons, missionLocaleJobs } from "./mission-locale";
import { organismesCrons, organismesJobs } from "./organismes";
import { transmissionsJobs } from "./transmissions";
import { voeuxAffelnetJobs } from "./voeux-affelnet";
import { whatsappCrons, whatsappJobs } from "./whatsapp";

type DomainRegistry = {
  jobs: Record<string, JobDef>;
  crons?: Record<string, CronDef>;
};

// Registre par domaine — sert à `yarn cli jobs:list` ; la fusion `jobs` en est dérivée.
export const registry = {
  daily: { jobs: dailyJobs, crons: dailyCrons },
  formations: { jobs: formationsJobs, crons: formationsCrons },
  organismes: { jobs: organismesJobs, crons: organismesCrons },
  effectifs: { jobs: effectifsJobs, crons: effectifsCrons },
  "mission-locale": { jobs: missionLocaleJobs, crons: missionLocaleCrons },
  deca: { jobs: decaJobs, crons: decaCrons },
  "voeux-affelnet": { jobs: voeuxAffelnetJobs },
  ingestion: { jobs: ingestionJobs },
  fiabilisation: { jobs: fiabilisationJobs },
  transmissions: { jobs: transmissionsJobs },
  emails: { jobs: emailsJobs, crons: emailsCrons },
  whatsapp: { jobs: whatsappJobs, crons: whatsappCrons },
  brevo: { jobs: brevoJobs, crons: brevoCrons },
  "db-maintenance": { jobs: dbMaintenanceJobs },
  divers: { jobs: diversJobs, crons: diversCrons },
} satisfies Record<string, DomainRegistry>;

export const jobs: Record<string, JobDef> = Object.assign({}, ...Object.values(registry).map((domain) => domain.jobs));

export { crons } from "./crons";
