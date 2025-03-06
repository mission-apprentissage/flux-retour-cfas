import { captureException } from "@sentry/node";
import { WithId } from "mongodb";
import { IEffectifQueue } from "shared/models/data/effectifsQueue.model";
import dossierApprenantSchemaV3 from "shared/models/parts/dossierApprenantSchemaV3";

import parentLogger from "@/common/logger";

import { buildAdresse } from "./adresse/adresse.builder";
import { ingestEffectifV2 } from "./effectif/effectif.ingestion";
import { ingestFormationV2 } from "./formationV2/formationV2.ingestion";
import { ingestPersonV2 } from "./person/person.ingestion";

const logger = parentLogger.child({
  module: "process-ingestion.v2",
});

export async function handleEffectifTransmission(
  effectifQueue: WithId<IEffectifQueue>,
  date_transmission: Date
): Promise<void> {
  try {
    const dossier = dossierApprenantSchemaV3.parse(effectifQueue);

    const adresse = await buildAdresse(dossier);

    const [formation, person] = await Promise.all([ingestFormationV2(dossier), ingestPersonV2(dossier)]);

    await ingestEffectifV2({
      dossier,
      adresse,
      person_id: person._id,
      formation_id: formation._id,
      date_transmission,
    });
  } catch (e) {
    logger.error("Error while processing effectif transmission v2", e);
    captureException(e);
  }
}
