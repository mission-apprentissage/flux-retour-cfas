import logger from "../../../common/logger.js";
import { updateEffectifsCount } from "../../../common/actions/organismes/organismes.actions.js";
import { organismesDb } from "../../../common/model/collections.js";

export const hydrateOrganismesEffectifsCount = async () => {
  const organismes = await organismesDb().find({}).toArray();

  for (var i = 0; i < organismes.length; i++) {
    const organisme = organismes[i];
    logger.debug(`Process organisme ${organisme._id}`);

    await updateEffectifsCount(organisme._id);
  }
  logger.info(`${organismes.length} organismes processed`);
};
