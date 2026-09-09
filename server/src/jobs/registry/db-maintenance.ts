import { addJob, type JobDef } from "job-processor";

import { modelDescriptors } from "@/common/model/collections";
import { createCollectionIndexes } from "@/common/model/indexes/createCollectionIndexes";

import { findInvalidDocuments } from "../db/findInvalidDocuments";
import { recreateIndexes } from "../db/recreateIndexes";
import { validateModels } from "../db/schemaValidation";
import { create as createMigration, status as statusMigration, up as upMigration } from "../migrations/migrations";

const requireStringPayload = (payload: Record<string, unknown> | null | undefined, key: string): string => {
  const value = payload?.[key];
  if (typeof value !== "string" || !value) {
    throw new Error(`Paramètre "${key}" manquant`);
  }
  return value;
};

const isDropRequested = (payload: Record<string, unknown> | null | undefined) =>
  payload?.drop === true || payload?.drop === "true";

export const dbMaintenanceJobs = {
  "db:find-invalid-documents": {
    handler: async (job) => {
      return findInvalidDocuments(requireStringPayload(job.payload, "collection"));
    },
  },
  "indexes:create": {
    handler: async (job) => {
      return recreateIndexes({ drop: isDropRequested(job.payload) });
    },
  },
  "indexes:recreate": {
    handler: async (job) => {
      return recreateIndexes({ drop: isDropRequested(job.payload) });
    },
  },
  "indexes:collection:create": {
    handler: async (job) => {
      const collectionName = requireStringPayload(job.payload, "collection");
      return createCollectionIndexes(modelDescriptors.find((d) => d.collectionName === collectionName));
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
      return createMigration({ description: requireStringPayload(job.payload, "description") });
    },
  },
} satisfies Record<string, JobDef>;
