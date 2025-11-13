import { getDbCollection } from "@/common/mongodb";

export const up = async () => {
  const db = getDbCollection("missionLocaleStats");

  const indexes = await db.indexes();
  const hasOldIndex = indexes.some((index) => index.name === "mission_locale_id_1");

  if (hasOldIndex) {
    await db.dropIndex("mission_locale_id_1");
  }

  await db.createIndex({ mission_locale_id: 1, computed_day: 1 }, { unique: true });
};
