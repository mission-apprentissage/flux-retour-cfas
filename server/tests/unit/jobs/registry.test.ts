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
});
