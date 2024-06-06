import { captureException } from "@sentry/node";

import {
  updateOrganismesHasTransmittedWithHierarchy,
  updateDecaCompatibilityFromOrganismeId,
} from "@/common/actions/organismes/organismes.actions";
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

export const updateOrganismesDecaTransmitter = async () => {
  try {
    logger.info(`updateOrganismesDecaTransmitter: processing`);
    const organismesCursor = organismesDb().find({ is_transmission_target: true });
    while (await organismesCursor.hasNext()) {
      const organisme = await organismesCursor.next();
      if (organisme) {
        await updateDecaCompatibilityFromOrganismeId(organisme._id, false);
      }
    }
  } catch (err) {
    captureException(err);
  }
};
