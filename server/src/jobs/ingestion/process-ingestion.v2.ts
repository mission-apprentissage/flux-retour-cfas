import { captureException } from "@sentry/node";
import { WithId } from "mongodb";
import { IEffectifQueue } from "shared/models/data/effectifsQueue.model";
import dossierApprenantSchemaV3 from "shared/models/parts/dossierApprenantSchemaV3";

import parentLogger from "@/common/logger";

const logger = parentLogger.child({
  module: "process-ingestion.v2",
});

export async function handleEffectifTransmission(effectifQueue: WithId<IEffectifQueue>): Promise<void> {
  try {
    dossierApprenantSchemaV3.parse(effectifQueue);
  } catch (e) {
    logger.error("Error while processing effectif transmission v2", e);
    captureException(e);
  }
}
