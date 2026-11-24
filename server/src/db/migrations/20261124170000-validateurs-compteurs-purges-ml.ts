import logger from "@/common/logger";

export const up = async () => {
  logger.info(
    { collections: ["missionLocaleStatsPurges", "missionLocaleEffectifsPurgesStats"] },
    "[Migration] Collections des compteurs de purge ML, validateurs posés au démarrage, aucun document à migrer"
  );
};
