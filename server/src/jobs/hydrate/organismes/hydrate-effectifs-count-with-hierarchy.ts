import { captureException } from "@sentry/node";

import { updateEffectifsCountWithHierarchy } from "@/common/actions/organismes/organismes.actions";
import logger from "@/common/logger";
import { organismesDb } from "@/common/model/collections";

export const hydrateOrganismesEffectifsCountWithHierarchy = async () => {
  try {
    logger.info(`hydrateOrganismesEffectifsCount: processing`);
    const organismesCursor = organismesDb().find({});

    while (await organismesCursor.hasNext()) {
      const organisme = await organismesCursor.next();
      if (organisme) {
        await updateEffectifsCountWithHierarchy(organisme._id);
      }
    }

    logger.info(`hydrateOrganismesEffectifsCount: processed`);
  } catch (err) {
    captureException(err);
  }
};
