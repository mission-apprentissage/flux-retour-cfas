import { Db } from "mongodb";

import logger from "@/common/logger";

export const up = async (db: Db) => {
  const { modifiedCount } = await db
    .collection("invitationsArchive")
    .updateMany({ token: { $exists: true } }, { $unset: { token: "" } });

  logger.info({ modifiedCount }, "[Migration] jeton retiré des invitations archivées");
};
