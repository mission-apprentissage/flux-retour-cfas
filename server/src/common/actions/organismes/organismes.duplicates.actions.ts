import { ObjectId } from "mongodb";

import { auditLogsDb, effectifsDb, organisationsDb, organismesDb } from "@/common/model/collections";
import { getEffectifsDuplicatesFromOrganismes } from "@/jobs/fiabilisation/uai-siret/update.utils";

import { getUsersLinkedToOrganismeId } from "../users.actions";

/**
 * Fonction de récupération des organismes à fusionner = duplicats d'organismes
 * Organismes groupés par SIRET dont il existe au moins un organisme avec UAI vide
 * On ajout sur chaque organisme le nombre de comptes utilisateurs liés
 */
export const getDuplicatesOrganismes = async () => {
  const duplicatesGroup = await organismesDb()
    .aggregate([
      {
        $group: {
          _id: { siret: "$siret" },
          count: { $sum: 1 },
          duplicates: {
            $addToSet: {
              id: "$_id",
              nom: "$nom",
              uai: "$uai",
              siret: "$siret",
              raison_sociale: "$raison_sociale",
              nature: "$nature",
              ferme: "$ferme",
              last_transmission_date: "$last_transmission_date",
              created_at: "$created_at",
              updated_at: "$updated_at",
              effectifs_count: "$effectifs_count",
              nbUsers: 0,
            },
          },
        },
      },
      { $match: { count: { $gt: 1 }, "duplicates.uai": { $in: [null] } } },
    ])
    .toArray();

  if (duplicatesGroup.length === 1) {
    duplicatesGroup[0].duplicates = await Promise.all(
      duplicatesGroup[0]?.duplicates.map(async (duplicate) => ({
        ...duplicate,
        nbUsers: (await getUsersLinkedToOrganismeId(duplicate?.id)).length ?? 0,
      }))
    );
  }

  return duplicatesGroup;
};

/**
 * Fonction de fusion d'organismes pour un organisme sans uai et un organisme fiable
 * On déplace tous les effectifs vers l'organisme fiable
 * On MAJ toutes les organisations vers le couple UAI SIRET fiable
 * On supprime l'organisme sans UAI
 * @param organismeSansUaiId
 * @param organismeFiableId
 */
export const mergeOrganismeSansUaiDansOrganismeFiable = async (
  organismeSansUaiId: ObjectId,
  organismeFiableId: ObjectId
) => {
  await auditLogsDb().insertOne({
    action: "mergeOrganismeSansUaiDansOrganismeFiable-init",
    date: new Date(),
    data: { organismeFiableId: organismeFiableId, organismeSansUaiId: organismeSansUaiId },
  });

  const organismeSansUai = await organismesDb().findOne({ _id: organismeSansUaiId });
  const organismeFiable = await organismesDb().findOne({ _id: organismeFiableId });

  if (!organismeFiable) throw new Error("Organisme fiable non trouvé en base !");
  if (!organismeSansUai) throw new Error("Organisme sans UAI non trouvé en base !");

  // Déplacement des effectifs de l'organisme sans UAI vers l'organisme fiable (pas d'updateMany car doublons potentiels)

  // 1. On vérifie s'il existe des doublons en commun sur l'organisme fiable et non fiable
  const duplicatesForFiableAndNonFiable = await getEffectifsDuplicatesFromOrganismes(
    organismeFiableId,
    organismeSansUaiId
  );
  let deletedDuplicates = 0;
  let updatedDuplicates = 0;
  let updatedEffectifsLinkedToOrganismeSansUai = 0;

  const effectifsOrganismeSansUai = await effectifsDb().find({ organisme_id: organismeSansUaiId }).toArray();

  // 1. Si aucun doublon on update
  if (duplicatesForFiableAndNonFiable.length === 0) {
    await Promise.all(
      effectifsOrganismeSansUai.map(async (effectifToMove) => {
        const { modifiedCount } = await effectifsDb().updateOne(
          { _id: effectifToMove._id },
          { $set: { organisme_id: organismeFiableId } }
        );
        updatedEffectifsLinkedToOrganismeSansUai += modifiedCount;
      })
    ).catch(async (err) => {
      await auditLogsDb().insertOne({
        action: "mergeOrganismeSansUaiDansOrganismeFiable-end",
        date: new Date(),
        data: `Impossible de déplacer l'effectif de l'organisme sans uai vers l'organisme fiable : ${err}`,
      });
      throw new Error("Impossible de déplacer l'effectif de l'organisme sans uai vers l'organisme fiable : ", err);
    });
  } else {
    // Si doublons, on garde les doublons les plus récents
    await Promise.all(
      duplicatesForFiableAndNonFiable.map(async ({ duplicatesInfo }) => {
        if (duplicatesInfo.length > 1) {
          const effectifIdToKeep = duplicatesInfo.reduce((a, b) => (a.created_at > b.created_at ? a : b))?.id ?? null;

          if (effectifIdToKeep) {
            // Suppression des doublons les plus anciens
            const effectifsIdToRemove = duplicatesInfo
              .filter((item) => item.id !== effectifIdToKeep)
              .map((item) => item.id);

            const { deletedCount } = await effectifsDb().deleteMany({ _id: { $in: effectifsIdToRemove } });
            deletedDuplicates += deletedCount;

            // Update du doublon le plus récent
            const { modifiedCount } = await effectifsDb().updateOne(
              { _id: effectifIdToKeep },
              { $set: { organisme_id: organismeFiableId } }
            );
            updatedDuplicates += modifiedCount;
          }
        }
      })
    );
  }

  // MAJ des organisations liés à l'organisme sans UAI vers l'organisme fiable
  const { modifiedCount: organisationsUpdatedCount } = await organisationsDb().updateMany(
    { uai: organismeSansUai?.uai, siret: organismeSansUai?.siret },
    { $set: { uai: organismeFiable.uai, siret: organismeFiable.siret } }
  );

  // Suppression des effectifs de l'organisme sans UAI
  const { deletedCount: effectifsDeletedCount } = await effectifsDb().deleteMany({ organisme_id: organismeSansUaiId });

  // Suppression de l'organisme sans UAI
  const { deletedCount: organismeDeletedCount } = await organismesDb().deleteOne({ _id: organismeSansUaiId });

  await auditLogsDb().insertOne({
    action: "mergeOrganismeSansUaiDansOrganismeFiable-end",
    date: new Date(),
    data: {
      updatedEffectifsLinkedToOrganismeSansUai,
      deletedDuplicates,
      updatedDuplicates,
      organisationsUpdatedCount,
      effectifsDeletedCount,
      organismeDeletedCount,
      duplicatesForFiableAndNonFiable,
    },
  });
};
