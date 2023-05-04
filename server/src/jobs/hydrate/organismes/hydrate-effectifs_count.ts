import Logger from "bunyan";

import { updateEffectifsCount } from "@/common/actions/organismes/organismes.actions";
import { organismesDb } from "@/common/model/collections";

export const hydrateOrganismesEffectifsCount = async (logger: Logger) => {
  const organismes = await organismesDb().find({}).toArray();

  logger.info(`Processing ${organismes.length} organismes`);
  for (var i = 0; i < organismes.length; i++) {
    const organisme = organismes[i];
    await updateEffectifsCount(organisme._id);
  }
  logger.info(`${organismes.length} organismes processed`);
};
