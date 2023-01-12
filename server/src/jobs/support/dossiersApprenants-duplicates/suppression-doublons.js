import { runScript } from "../../scriptWrapper.js";
import { asyncForEach } from "../../../common/utils/asyncUtils.js";
import logger from "../../../common/logger.js";
import { dossiersApprenantsDb } from "../../../common/model/collections.js";

runScript(async () => {
  const idErpApprenantNotNullStage = {
    $match: {
      id_erp_apprenant: { $ne: null },
      annee_scolaire: { $in: ["2022-2022", "2022-2023"] },
    },
  };
  const groupByUnicityKeyStage = {
    $group: {
      _id: {
        id_erp_apprenant: "$id_erp_apprenant",
        uai: "$uai_etablissement",
        annee_scolaire: "$annee_scolaire",
      },
      count: { $sum: 1 },
      dossiers: { $addToSet: "$$ROOT" },
    },
  };

  const multipleDossiersForUnicityKeyMatchStage = {
    $match: { count: { $gt: 1 } },
  };

  const duplicatesGroups = await dossiersApprenantsDb()
    .aggregate([idErpApprenantNotNullStage, groupByUnicityKeyStage, multipleDossiersForUnicityKeyMatchStage])
    .toArray();

  let deletionCount = 0;
  await asyncForEach(duplicatesGroups, async (duplicateGroup) => {
    // on trie chronologiquement par updated_at si le champ existe, sinon par created_at
    const sortedByUpdatedAtDate = duplicateGroup.dossiers.sort((a, b) => {
      if (!a.updated_at || !b.updated_at) {
        return a.created_at - b.created_at;
      }
      return a.updated_at - b.updated_at;
    });
    // on garde le statut avec date de réception ou de création le plus récent, on supprime les autres
    // eslint-disable-next-line no-unused-vars
    const [_toKeep, ...toDelete] = sortedByUpdatedAtDate.slice().reverse();
    logger.info("Va supprimer", toDelete.length, "doublons avec info d'unicité", duplicateGroup._id);
    await asyncForEach(toDelete, async (dossierToDelete) => {
      logger.info("Supression du dossier apprenant avec _id", dossierToDelete._id.toString());
      const result = await dossiersApprenantsDb().deleteOne({ _id: dossierToDelete._id });
      deletionCount += result.deletedCount;
    });
  });
  logger.info(deletionCount, "dossiers apprenants ont été supprimés");
}, "suppression-doublons");
