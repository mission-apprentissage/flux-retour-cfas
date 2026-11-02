import logger from "@/common/logger";
import { demandesActivationCfaDb } from "@/common/model/collections";

export const up = async () => {
  const { deletedCount } = await demandesActivationCfaDb().deleteMany({
    siret_saisi: "",
    siret_corrige: { $in: [null, ""] },
    statut: "pret",
  });

  logger.info({ deletedCount }, "[Migration] Demandes d'activation importées sans SIRET supprimées");
};
