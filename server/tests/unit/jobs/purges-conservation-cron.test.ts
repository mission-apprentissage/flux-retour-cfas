import { addJob } from "job-processor";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import config from "@/config";
import { effectifsCrons } from "@/jobs/registry/effectifs";

vi.mock("job-processor", async (importOriginal) => ({
  ...(await importOriginal<typeof import("job-processor")>()),
  addJob: vi.fn(),
}));

const cron = effectifsCrons["Purger les données conservées plus de deux ans le samedi à 14h"];
const lancer = () => cron.handler(new AbortController().signal);

describe("cron des purges de conservation", () => {
  const initial = { env: config.env, actives: config.purgesConservationActives };

  beforeEach(() => {
    vi.mocked(addJob).mockClear();
  });

  afterEach(() => {
    config.env = initial.env;
    config.purgesConservationActives = initial.actives;
  });

  it("n'enfile rien en production tant que l'interrupteur est coupé", async () => {
    config.env = "production";
    config.purgesConservationActives = false;

    await lancer();

    expect(addJob).not.toHaveBeenCalled();
  });

  it("n'enfile rien hors production, même interrupteur levé", async () => {
    config.env = "recette";
    config.purgesConservationActives = true;

    await lancer();

    expect(addJob).not.toHaveBeenCalled();
  });

  it("enfile les trois purges en production, interrupteur levé", async () => {
    config.env = "production";
    config.purgesConservationActives = true;

    await lancer();

    expect(vi.mocked(addJob).mock.calls.map(([job]) => job.name)).toStrictEqual([
      "purge:effectifs-anciens",
      "purge:dossiers-suivi",
      "purge:voeux-affelnet",
    ]);
  });
});
