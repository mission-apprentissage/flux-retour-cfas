import { describe, it, expect } from "vitest";

import { crons, jobs, registry } from "@/jobs/registry";

const domains = Object.entries(registry as Record<string, { jobs: object; crons?: object }>);

describe("registre des jobs", () => {
  it("expose chaque job d'un domaine dans la fusion", () => {
    const declared = domains.flatMap(([, domain]) => Object.keys(domain.jobs));

    expect(Object.keys(jobs).sort()).toEqual([...declared].sort());
  });

  it("expose chaque cron d'un domaine dans la fusion", () => {
    const declared = domains.flatMap(([, domain]) => Object.keys(domain.crons ?? {}));

    expect(Object.keys(crons).sort()).toEqual([...declared].sort());
  });

  it("ne déclare aucun nom de job en double entre domaines", () => {
    const declared = domains.flatMap(([, domain]) => Object.keys(domain.jobs));

    expect(declared).toHaveLength(new Set(declared).size);
  });

  it("ne déclare aucun nom de cron en double entre domaines", () => {
    const declared = domains.flatMap(([, domain]) => Object.keys(domain.crons ?? {}));

    expect(declared).toHaveLength(new Set(declared).size);
  });

  // Listes figées : supprimer ou reprogrammer un cron / retirer un job doit être un acte
  // explicite (mettre à jour ce test), pas un effet de bord d'un refacto du registre.
  it("conserve chaque cron avec son schedule", () => {
    const schedules = Object.fromEntries(Object.entries(crons).map(([name, cron]) => [name, cron.cron_string]));

    expect(schedules).toEqual({
      "Run daily jobs each day at 02h30": "30 2 * * *",
      "Import formations": "0 3 * * *",
      "Cleanup organismes": "0 3 * * *",
      "Révoque les clés API des organismes inactifs depuis +12 mois, tous les jours à 4h": "0 4 * * *",
      "Validation des constantes de territoires": "5 4 1 * *",
      "Nettoie et met à jour les statistiques des Missions Locales": "30 4 * * *",
      "Synchro Brevo de tous les contacts TBA à 5h": "0 5 * * *",
      "Mettre à jour les statuts d'effectifs tous les samedis matin à 5h": "0 5 * * 6",
      "Send reminder emails at 7h": "0 7 * * *",
      "Send CFA daily recap at 10h30": "30 10 * * *",
      "hydrate:contrats-deca-raw": "30 10 * * 7",
      "Send ML daily recap at 13h30": "30 13 * * *",
      "Send ML weekly recap at 14h30 on Mondays": "30 14 * * 1",
      "Envoi WhatsApp préqualif quotidien à 18h30": "30 18 * * *",
    });
  });

  it("conserve chaque job enregistré", () => {
    expect(Object.keys(jobs).sort()).toEqual([
      "brevo-contacts:sync",
      "brevo-contacts:sync-one",
      "brevo-events:track",
      "classifier:score-effectifs",
      "computed:update",
      "db:find-invalid-documents",
      "db:validate",
      "dev:generate-open-api",
      "fiabilisation:effectifs:transform-inscritsSansContrats-en-abandons-depuis",
      "fiabilisation:effectifs:transform-rupturants-en-abandons-depuis",
      "fiabilisation:uai-siret:run",
      "hydrate:bal-mails",
      "hydrate:contrats-deca-raw",
      "hydrate:daily",
      "hydrate:effectifs-formation-niveaux",
      "hydrate:effectifs:update_all_computed_statut",
      "hydrate:effectifs:update_computed_statut",
      "hydrate:formations-catalogue",
      "hydrate:mission-locale-effectif-snapshot",
      "hydrate:mission-locale-effectif-statut",
      "hydrate:mission-locale-from-deca",
      "hydrate:mission-locale-not-activated-effectif",
      "hydrate:mission-locale-organisation",
      "hydrate:mission-locale-stats",
      "hydrate:ofa-inconnus",
      "hydrate:opcos",
      "hydrate:organismes",
      "hydrate:organismes-effectifs-count",
      "hydrate:organismes-formations-count",
      "hydrate:organismes-has-account",
      "hydrate:organismes-organisations",
      "hydrate:organismes-relations",
      "hydrate:rncp",
      "hydrate:transmission-daily",
      "hydrate:transmissions-all",
      "hydrate:update-effectifs-lieu-de-formation",
      "hydrate:update-effectifs-organisme-lieu-vers-formateur",
      "hydrate:voeux-academie-code",
      "hydrate:voeux-effectifs-relations",
      "import:formation",
      "indexes:collection:create",
      "indexes:create",
      "indexes:recreate",
      "init:dev",
      "migrations:create",
      "migrations:status",
      "migrations:up",
      "organisme:cleanup",
      "organismes:revoke-stale-api-keys",
      "populate:reseaux",
      "process:effectifs-queue",
      "process:effectifs-queue:remove-duplicates",
      "process:effectifs-queue:single",
      "purge:queues",
      "send-cfa-daily-recap",
      "send-mission-locale-daily-recap",
      "send-mission-locale-weekly-recap",
      "territoire:validate",
      "tmp:force-hydrate-transmissions",
      "tmp:hydrate:inscrit-sans-contrat",
      "tmp:hydrate:rome-secteur-activites",
      "tmp:hydrate:timeseries-stats-ml",
      "tmp:migrate:autre-situations",
      "tmp:migrate:effectifs",
      "tmp:migrate:effectifs-queue",
      "tmp:migrate:mission-locale-current-status",
      "tmp:migrate:mission-locale-effectif-snapshot",
      "tmp:migrate:statuts-then-ml-current-status",
      "tmp:migration:dedoublon-organisation",
      "tmp:migration:ml-activation-date",
      "tmp:migration:ml-date-rupture",
      "tmp:migration:ml-duplication",
      "tmp:migration:ml-identifiant-normalise",
      "tmp:migration:ml-orphan-cross-family",
      "tmp:migration:ml-orphan-deca-to-erp",
      "tmp:migration:organisation-organisme",
      "tmp:mission-locale-adresse-update",
      "tmp:mission-locale-snapshot-update",
      "tmp:seed-ml-rdv-url",
      "tmp:seed-sipa-test-nancy",
      "tmp:whatsapp:send-injoignables",
      "tmp:whatsapp:send-prequalif",
      "whatsapp:send-prequalif-daily",
    ]);
  });
});
