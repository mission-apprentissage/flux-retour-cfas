import { type SentryEventLike } from "shared/observability/sentryPolicy";
import { describe, expect, it } from "vitest";

import { crons, jobs } from "@/jobs/registry";

import { applyAlertContract, JOB_META } from "./alertContract";

describe("JOB_META", () => {
  // Sans cette garde, ajouter un cron le laisserait silencieusement en « veille ».
  it("déclare un niveau pour chaque cron du registre", () => {
    const missing = Object.keys(crons).filter((name) => !JOB_META[name]);

    expect(missing).toEqual([]);
  });

  it("ne référence que des noms qui existent encore", () => {
    const known = new Set([...Object.keys(crons), ...Object.keys(jobs)]);
    const orphans = Object.keys(JOB_META).filter((name) => !known.has(name));

    expect(orphans).toEqual([]);
  });
});

describe("applyAlertContract", () => {
  it("dérive le niveau depuis le nom du job", () => {
    const event: SentryEventLike = { tags: { job: "Import formations" } };

    expect(applyAlertContract(event).tags?.alert_tier).toBe("jour");
  });

  it("n'écrase pas un niveau déjà posé par le code", () => {
    const event: SentryEventLike = { tags: { job: "Cleanup organismes", alert_tier: "oncall" } };

    expect(applyAlertContract(event).tags?.alert_tier).toBe("oncall");
  });

  it("laisse le niveau vide pour un job non déclaré", () => {
    const event: SentryEventLike = { tags: { job: "tmp:migrate:effectifs" } };

    expect(applyAlertContract(event).tags?.alert_tier).toBeUndefined();
  });

  it("dérive job_kind du contexte posé par job-processor", () => {
    const cron: SentryEventLike = { tags: { job: "Import formations" }, contexts: { job: { type: "cron_task" } } };
    const simple: SentryEventLike = { tags: { job: "hydrate:rncp" }, contexts: { job: { type: "simple" } } };

    expect(applyAlertContract(cron).tags?.job_kind).toBe("cron");
    expect(applyAlertContract(simple).tags?.job_kind).toBe("simple");
  });

  it("laisse intact un événement sans tag job", () => {
    const event: SentryEventLike = { tags: { route_group: "auth" } };

    expect(applyAlertContract(event).tags).toEqual({ route_group: "auth" });
  });
});
