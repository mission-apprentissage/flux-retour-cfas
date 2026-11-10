import usersMigrationModelDescriptor from "shared/models/data/usersMigration.model";

import logger from "@/common/logger";
import { usersMigrationDb } from "@/common/model/collections";

export const up = async () => {
  const [specTexte, optionsTexte] = usersMigrationModelDescriptor.indexes.find(([spec]) =>
    Object.values(spec as Record<string, unknown>).includes("text")
  )!;

  const indexes = await usersMigrationDb()
    .indexes()
    .catch(() => []);
  const ancien = indexes.find((index) => index.key._fts === "text" && index.name !== optionsTexte.name);

  if (!ancien?.name) {
    logger.info("[Migration] Aucun ancien index texte sur usersMigration");
    return;
  }

  await usersMigrationDb().dropIndex(ancien.name);
  await usersMigrationDb().createIndex(specTexte, optionsTexte);
  logger.info({ index: ancien.name }, "[Migration] Index texte de usersMigration recréé");
};
