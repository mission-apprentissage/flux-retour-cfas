import { addJob } from "job-processor";
import type { ObjectId } from "mongodb";
import { MOTIF_SUPPRESSION } from "shared/constants";

import { softDeleteEffectif } from "@/common/actions/effectifs.actions";
import logger from "@/common/logger";
import { effectifsDb, effectifsDECADb } from "@/common/model/collections";
import { recreateIndexes } from "@/jobs/db/recreateIndexes";

export const up = async () => {
  const effectifDuplicats = await effectifsDb()
    .aggregate<{
      _id: {
        annee_scolaire: string;
        cfd: string;
        rncp: string;
        id_erp_apprenant: string;
        organisme_id: string;
      };
      count: number;
      docs: {
        id: ObjectId;
        updated_at: Date;
      }[];
    }>([
      {
        $group: {
          _id: {
            annee_scolaire: "$annee_scolaire",
            cfd: "$formation.cfd",
            rncp: "$formation.rncp",
            id_erp_apprenant: "$id_erp_apprenant",
            organisme_id: "$organisme_id",
          },
          count: {
            $sum: 1,
          },
          docs: {
            $addToSet: {
              id: "$_id",
              updated_at: "$updated_at",
            },
          },
        },
      },
      {
        $match: { count: { $gt: 1 } },
      },
    ])
    .toArray();

  for (const effectifDuplicat of effectifDuplicats) {
    const { docs } = effectifDuplicat;
    const lastUpdatedDoc = docs.reduce((acc, doc) => {
      if (doc.updated_at.getTime() > acc.updated_at.getTime()) {
        return doc;
      }

      return acc;
    }, docs[0]);

    await softDeleteEffectif(lastUpdatedDoc.id, null, {
      motif: MOTIF_SUPPRESSION.Doublon,
      description: "Suppression du doublon suite à la migration index unique sur effectifs",
    });
  }

  const effectifDecaDuplicats = await effectifsDECADb()
    .aggregate<{
      _id: {
        annee_scolaire: string;
        cfd: string;
        rncp: string;
        id_erp_apprenant: string;
        organisme_id: string;
      };
      count: number;
      docs: {
        id: ObjectId;
        updated_at: Date;
      }[];
    }>([
      {
        $group: {
          _id: {
            annee_scolaire: "$annee_scolaire",
            cfd: "$formation.cfd",
            rncp: "$formation.rncp",
            id_erp_apprenant: "$id_erp_apprenant",
            organisme_id: "$organisme_id",
          },
          count: {
            $sum: 1,
          },
          docs: {
            $addToSet: {
              id: "$_id",
              updated_at: "$updated_at",
            },
          },
        },
      },
      {
        $match: { count: { $gt: 1 } },
      },
    ])
    .toArray();

  for (const effectifDuplicat of effectifDecaDuplicats) {
    const { docs } = effectifDuplicat;
    const lastUpdatedDoc = docs.reduce((acc, doc) => {
      if (doc.updated_at.getTime() > acc.updated_at.getTime()) {
        return doc;
      }

      return acc;
    }, docs[0]);

    await effectifsDECADb().deleteMany({ _id: { $ne: lastUpdatedDoc.id } });
  }

  // Recreate indexes before dropping unique index as it will be used to create new indexes
  await recreateIndexes({ drop: false });

  // DROP unique index
  try {
    await effectifsDb().dropIndex(
      "organisme_id_1_annee_scolaire_1_id_erp_apprenant_1_apprenant.nom_1_apprenant.prenom_1_formation.cfd_1_formation.annee_1"
    );
  } catch (error) {
    logger.error(
      "20241211154816-deduplication-effectifs-auto - impossible de supprimer l'index unique sur la collection effectifs"
    );
  }

  await addJob({
    name: "tmp:migration:duplicat-formation",
    queued: true,
  });
};
