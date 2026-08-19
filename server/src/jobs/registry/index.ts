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

// Registre par domaine — source de vérité unique : `jobs` et `crons` en sont dérivés,
// et `yarn cli jobs:list` l'affiche. Ajouter un domaine ici suffit.
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

function mergeDomains<T>(kind: string, pick: (domain: DomainRegistry) => Record<string, T> | undefined) {
  const merged: Record<string, T> = {};
  const origin: Record<string, string> = {};

  for (const [domainName, domain] of Object.entries(registry as Record<string, DomainRegistry>)) {
    for (const [name, def] of Object.entries(pick(domain) ?? {})) {
      if (name in merged) {
        throw new Error(
          `Registre des jobs : ${kind} "${name}" déclaré à la fois dans "${origin[name]}" et "${domainName}". ` +
            `Les noms doivent être uniques tous domaines confondus.`
        );
      }
      merged[name] = def;
      origin[name] = domainName;
    }
  }

  return merged;
}

export const jobs = mergeDomains<JobDef>("job", (domain) => domain.jobs);

/**
 * ATTENTION : les cron_string sont interprétés en Europe/Paris, PAS en UTC.
 * Ne jamais décaler un horaire pour "compenser" un fuseau.
 *
 * Planning à jour : `yarn cli jobs:list`.
 */
export const crons = mergeDomains<CronDef>("cron", (domain) => domain.crons);
