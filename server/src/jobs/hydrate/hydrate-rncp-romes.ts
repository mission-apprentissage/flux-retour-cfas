import { readFileSync } from "node:fs";

import { PromisePool } from "@supercharge/promise-pool";

import parentLogger from "@/common/logger";
import { Rncp } from "@/common/model/@types/Rncp";
import { rncpDb } from "@/common/model/collections";

const logger = parentLogger.child({
  module: "job:hydrate:rncp-romes",
});

/**
 * Ce job récupère un export du RNCP pour le mettre dans la collection rncp.
 * Contient pour l'instant uniquement les associations RNCP -> codes ROME.
 */
export async function hydrateRNCPRomes() {
  // temporaire, puis on mettra la récupération du fichier directement
  const listeRNCP = JSON.parse(readFileSync("rncp-romes.json", "utf8")) as Rncp[];

  logger.info({ count: listeRNCP.length }, "import des rncp avec romes");

  await PromisePool.for(listeRNCP)
    .withConcurrency(50)
    .process(async (rncp) => {
      await rncpDb().updateOne(
        {
          rncp: rncp.rncp,
        },
        {
          $set: {
            romes: rncp.romes,
          },
        },
        {
          upsert: true,
        }
      );
    });
}
