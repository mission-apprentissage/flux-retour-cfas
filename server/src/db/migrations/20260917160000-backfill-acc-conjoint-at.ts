import logger from "@/common/logger";
import { missionLocaleEffectifsDb } from "@/common/model/collections";

export const up = async () => {
  const { modifiedCount } = await missionLocaleEffectifsDb().updateMany(
    { "organisme_data.acc_conjoint": true, "organisme_data.acc_conjoint_at": { $exists: false } },
    [{ $set: { "organisme_data.acc_conjoint_at": { $ifNull: ["$organisme_data.reponse_at", "$created_at"] } } }]
  );

  logger.info({ modifiedCount }, "[Migration] acc_conjoint_at posé sur les dossiers de collaboration");
};
