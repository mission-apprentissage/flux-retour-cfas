import { AsyncLocalStorage } from "async_hooks";

import { ObjectId } from "mongodb";

import parentLogger from "@/common/logger";
import { createErrorAggregator } from "@/common/utils/errorAggregator";

import { createOrUpdateMissionLocaleStats } from "./mission-locale-stats.actions";

const logger = parentLogger.child({ module: "stats-ml-differees" });

const storage = new AsyncLocalStorage<Set<string>>();

export async function recalculerStatsMl(missionLocaleId: ObjectId): Promise<void> {
  const differees = storage.getStore();
  if (differees) {
    differees.add(missionLocaleId.toString());
    return;
  }
  await createOrUpdateMissionLocaleStats(missionLocaleId);
}

export async function withStatsMlDifferees<T>(fn: () => Promise<T>): Promise<T> {
  const differees = new Set<string>();
  try {
    return await storage.run(differees, fn);
  } finally {
    const echecs = createErrorAggregator("stats-ml-differees");
    for (const missionLocaleId of differees) {
      try {
        await createOrUpdateMissionLocaleStats(new ObjectId(missionLocaleId));
        echecs.ok();
      } catch (erreur) {
        echecs.record(erreur);
      }
    }
    logger.info({ missionsLocales: differees.size, echecs: echecs.failed }, "statistiques ML recalculées");
    echecs.flush();
  }
}
