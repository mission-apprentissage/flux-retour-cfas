import { describe, it, expect, beforeAll, beforeEach } from "@jest/globals";
import * as Sentry from "@sentry/node";
import { advanceTo, clear } from "jest-date-mock";
import sentryTestkit from "sentry-testkit";

import { createJob, findJob } from "@/common/actions/job.actions";
import { getSentryOptions } from "@/common/services/sentry/sentry";
import { executeJob } from "@/jobs/jobs_actions";
import { useMongo } from "@tests/jest/setupMongo";

const { testkit, sentryTransport } = sentryTestkit();

beforeAll(async () => {
  Sentry.init({
    ...getSentryOptions(),
    tracesSampleRate: 1,
    enabled: true,
    transport: sentryTransport,
  });
});

const timings = {
  created_at: new Date("2023-09-01T08:00:00.000Z"),
  scheduled_for: new Date("2023-09-01T08:00:00.100Z"),
  started_at: new Date("2023-09-01T08:00:01.000Z"),
  ended_at: new Date("2023-09-01T08:10:01.000Z"),
};

beforeEach(function () {
  advanceTo(timings.created_at);
  testkit.reset();
});

afterAll(() => {
  clear();
});

describe("executeJob", () => {
  useMongo();
  describe("when job is success", () => {
    it("should return exit code", async () => {
      const job = await createJob({
        name: "success:job",
        type: "simple",
        payload: { name: "Moroine" },
        scheduled_for: timings.scheduled_for,
        sync: true,
      });

      advanceTo(timings.started_at);
      const fn = import.meta.jest.fn().mockImplementation(async () => {
        advanceTo(timings.ended_at);
        return "Hello World";
      });

      await expect(executeJob(job, fn)).resolves.toBe(0);

      await expect(findJob({ _id: job._id })).resolves.toEqual({
        ...job,
        status: "finished",
        output: {
          duration: "10 minutes",
          result: "Hello World",
          error: null,
        },
        ...timings,
        updated_at: timings.ended_at,
      });

      await Sentry.flush(10_000);

      const tags = {
        job: job.name,
        transaction: `JOB: ${job.name}`,
      };

      expect(testkit.reports()).toHaveLength(0);
      expect(testkit.transactions()).toHaveLength(1);
      expect(testkit.transactions()[0]).toMatchObject({
        name: tags.transaction,
        spans: [
          { description: "updateOne", op: "db" },
          { description: "updateOne", op: "db" },
        ],
        tags,
      });
    });
  });

  describe("when job fails", () => {
    it("should return exit code", async () => {
      const job = await createJob({
        name: "failure:job",
        type: "simple",
        payload: { name: "Moroine" },
        scheduled_for: timings.scheduled_for,
        sync: true,
      });

      advanceTo(timings.started_at);
      const fn = import.meta.jest.fn().mockImplementation(async () => {
        advanceTo(timings.ended_at);
        throw new Error("Job Failure");
      });

      await expect(executeJob(job, fn)).resolves.toBe(1);

      await expect(findJob({ _id: job._id })).resolves.toEqual({
        ...job,
        status: "errored",
        output: {
          duration: "10 minutes",
          result: null,
          error: expect.stringContaining("Error: Job Failure\n    at"),
        },
        ...timings,
        updated_at: timings.ended_at,
      });

      await Sentry.flush(10_000);

      const tags = {
        job: job.name,
        transaction: `JOB: ${job.name}`,
      };

      expect(testkit.reports()).toHaveLength(1);
      expect(testkit.reports()[0]).toMatchObject({
        error: {
          message: "Job Failure",
        },
        level: "error",
        tags,
      });
      expect(testkit.transactions()).toHaveLength(1);
      expect(testkit.transactions()[0]).toMatchObject({
        name: tags.transaction,
        spans: [
          { description: "updateOne", op: "db" },
          { description: "updateOne", op: "db" },
        ],
        tags,
      });
    });
  });
});
