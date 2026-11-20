import type { IJobsSimple } from "job-processor";
import { ObjectId } from "mongodb";
import { describe, expect, it } from "vitest";

import { getDbCollection } from "@/common/mongodb";
import { effectifsJobs } from "@/jobs/registry/effectifs";
import { voeuxAffelnetJobs } from "@/jobs/registry/voeux-affelnet";
import { useMongo } from "@tests/jest/setupMongo";

import { refuserPurgesConcurrentes } from "./verrou-purges";

useMongo();

const job = (name: string, status: string) => ({
  _id: new ObjectId(),
  type: "simple",
  name,
  status,
  created_at: new Date(),
  updated_at: new Date(),
});

const inserer = (jobs: ReturnType<typeof job>[]) => getDbCollection("job_processor.jobs").insertMany(jobs);

describe("refuserPurgesConcurrentes()", () => {
  it("laisse passer la purge seule en cours", async () => {
    await inserer([job("purge:effectifs-anciens", "running"), job("purge:dossiers-suivi", "finished")]);

    await expect(refuserPurgesConcurrentes("purge:effectifs-anciens")).resolves.toBeUndefined();
  });

  it("refuse une purge quand une autre purge de conservation tourne déjà", async () => {
    await inserer([job("purge:effectifs-anciens", "running"), job("purge:voeux-affelnet", "running")]);

    await expect(refuserPurgesConcurrentes("purge:voeux-affelnet")).rejects.toThrow(
      "une autre purge de conservation est en cours"
    );
  });

  it("ignore les autres jobs en cours", async () => {
    await inserer([job("purge:effectifs-anciens", "running"), job("purge:queues", "running")]);

    await expect(refuserPurgesConcurrentes("purge:effectifs-anciens")).resolves.toBeUndefined();
  });

  it("est appelé par les jobs de purge", async () => {
    await inserer([job("purge:effectifs-anciens", "running"), job("purge:voeux-affelnet", "running")]);
    const simulation = (name: string) => ({ name, payload: { dryRun: true } }) as unknown as IJobsSimple;

    await expect(
      effectifsJobs["purge:effectifs-anciens"].handler(simulation("purge:effectifs-anciens"))
    ).rejects.toThrow("une autre purge");
    await expect(voeuxAffelnetJobs["purge:voeux-affelnet"].handler(simulation("purge:voeux-affelnet"))).rejects.toThrow(
      "une autre purge"
    );
  });
});
