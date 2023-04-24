import { updateEffectifsCount } from "@/common/actions/organismes/organismes.actions";
import logger from "@/common/logger";
import { organismesDb } from "@/common/model/collections";

export const hydrateOrganismesEffectifsCount = async () => {
  const organismes = await organismesDb().find({}).toArray();

  logger.info(`Processing ${organismes.length} organismes`);
  for (var i = 0; i < organismes.length; i++) {
    const organisme = organismes[i];
    await updateEffectifsCount(organisme._id);
  }
  logger.info(`${organismes.length} organismes processed`);
};
