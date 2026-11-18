import type { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { ZodType } from "zod";

export const SIX_MOIS_EN_SECONDES = 183 * 24 * 3600;
export const DOUZE_MOIS_EN_SECONDES = 365 * 24 * 3600;

export type CollectionName = "users" | "jobs" | "rome" | "auditLogs";

export interface IModelDescriptor {
  zod: ZodType;
  indexes: [IndexSpecification, CreateIndexesOptions][];
  collectionName: CollectionName;
}
