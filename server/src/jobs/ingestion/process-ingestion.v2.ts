import { captureException } from "@sentry/node";
import { WithId } from "mongodb";
import { IEffectifQueue } from "shared/models/data/effectifsQueue.model";
import dossierApprenantSchemaV3 from "shared/models/parts/dossierApprenantSchemaV3";

import parentLogger from "@/common/logger";

import { ingestFormationV2 } from "./formationV2/formationV2.ingestion";
import { ingestPersonV2 } from "./person/person.ingestion";

const logger = parentLogger.child({
  module: "process-ingestion.v2",
});

export async function handleEffectifTransmission(effectifQueue: WithId<IEffectifQueue>): Promise<void> {
  try {
    const dossier = dossierApprenantSchemaV3.parse(effectifQueue);

    await Promise.all([ingestFormationV2(dossier), ingestPersonV2(dossier)]);
  } catch (e) {
    logger.error("Error while processing effectif transmission v2", e);
    captureException(e);
  }
}
