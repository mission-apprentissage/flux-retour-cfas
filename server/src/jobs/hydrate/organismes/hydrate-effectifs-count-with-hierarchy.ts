import { captureException } from "@sentry/node";

import { updateOrganismesHasTransmittedWithHierarchy } from "@/common/actions/organismes/organismes.actions";
import logger from "@/common/logger";
import { organismesDb } from "@/common/model/collections";

export const hydrateOrganismesEffectifsCountWithHierarchy = async () => {
  try {
    logger.info(`hydrateOrganismesEffectifsCount: processing`);
    const organismesCursor = organismesDb().find({});
    while (await organismesCursor.hasNext()) {
      const organisme = await organismesCursor.next();
      if (organisme) {
        await updateOrganismesHasTransmittedWithHierarchy(organisme);
      }
    }

    logger.info(`hydrateOrganismesEffectifsCount: processed`);
  } catch (err) {
    captureException(err);
  }
};
