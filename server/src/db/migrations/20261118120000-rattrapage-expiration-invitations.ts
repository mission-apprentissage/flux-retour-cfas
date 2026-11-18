import { Db } from "mongodb";

import logger from "@/common/logger";

const DUREE_INVITATION_MS = 96 * 60 * 60 * 1000;

export const up = async (db: Db) => {
  const invitations = db.collection("invitations");

  const { modifiedCount } = await invitations.updateMany(
    { expires_at: { $exists: false }, created_at: { $type: "date" } },
    [{ $set: { expires_at: { $add: ["$created_at", DUREE_INVITATION_MS] } } }]
  );
  const sansDate = await invitations.countDocuments({ expires_at: { $exists: false } });

  logger.info({ modifiedCount, sansDate }, "[Migration] expires_at posé sur les invitations qui n'en avaient pas");
};
