declare module "migrate-mongo" {
  import type { Db, MongoClient } from "mongodb";

  interface MigrationStatus {
    fileName: string;
    appliedAt: string;
  }

  export const config: { set(config: Record<string, unknown>): void };
  export function create(description: string): Promise<string>;
  export function status(db: Db): Promise<MigrationStatus[]>;
  export function up(db: Db, client: MongoClient): Promise<string[]>;
}
