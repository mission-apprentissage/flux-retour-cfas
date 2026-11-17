import { captureException } from "@sentry/node";
import { WithId } from "mongodb";
import { IEffectifQueue } from "shared/models/data/effectifsQueue.model";
import dossierApprenantSchemaV3, { type IDossierApprenantSchemaV3 } from "shared/models/parts/dossierApprenantSchemaV3";

import parentLogger from "@/common/logger";
import type { ErrorAggregator } from "@/common/utils/errorAggregator";

import { ingestFormationV2, type IIngestFormationUsedFields } from "./formationV2/formationV2.ingestion";
import { ingestPersonV2, type IIngestPersonUsedFields } from "./person/person.ingestion";

const logger = parentLogger.child({
  module: "process-ingestion.v2",
});

async function ingestDossier(
  dossier: Pick<IDossierApprenantSchemaV3, IIngestFormationUsedFields | IIngestPersonUsedFields>
) {
  await Promise.all([ingestFormationV2(dossier), ingestPersonV2(dossier)]);
}

export async function handleEffectifTransmission(
  effectifQueue: WithId<IEffectifQueue>,
  errors?: ErrorAggregator
): Promise<void> {
  try {
    const dossier = dossierApprenantSchemaV3.parse(effectifQueue);
    await ingestDossier(dossier);
  } catch (e) {
    logger.error("Error while processing effectif transmission v2", e);
    if (errors) {
      errors.record(e);
    } else {
      captureException(e);
    }
  }
}
