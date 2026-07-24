import { addJob, type JobDef } from "job-processor";

import { createCollectionIndexes } from "@/common/model/indexes/createCollectionIndexes";

import { findInvalidDocuments } from "../db/findInvalidDocuments";
import { recreateIndexes } from "../db/recreateIndexes";
import { validateModels } from "../db/schemaValidation";
import { create as createMigration, status as statusMigration, up as upMigration } from "../migrations/migrations";

export const dbMaintenanceJobs = {
  "db:find-invalid-documents": {
    handler: async (job) => {
      return findInvalidDocuments((job.payload as any)?.collection);
    },
  },
  "indexes:create": {
    handler: async (job) => {
      return recreateIndexes((job.payload as any)?.drop);
    },
  },
  "indexes:recreate": {
    handler: async (job) => {
      return recreateIndexes((job.payload as any)?.drop);
    },
  },
  "indexes:collection:create": {
    handler: async (job) => {
      return createCollectionIndexes((job.payload as any)?.collection);
    },
  },
  "db:validate": {
    handler: async () => {
      return validateModels();
    },
  },
  "migrations:up": {
    handler: async () => {
      await upMigration();
      // Validate all documents after the migration
      await addJob({ name: "db:validate", queued: true });
      return;
    },
  },
  "migrations:status": {
    handler: async () => {
      const pendingMigrations = await statusMigration();
      console.log(`migrations-status=${pendingMigrations === 0 ? "synced" : "pending"}`);
      return;
    },
  },
  "migrations:create": {
    handler: async (job) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return createMigration(job.payload as any);
    },
  },
} satisfies Record<string, JobDef>;
