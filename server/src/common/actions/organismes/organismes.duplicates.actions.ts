import { organismesDb } from "@/common/model/collections";

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
              uai: "$uai",
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

  await Promise.all(
    duplicatesGroup.map((item) => {
      Promise.all(
        item.duplicates.map(async (duplicate) => {
          duplicate.nbUsers = (await getUsersLinkedToOrganismeId(duplicate?.id)).length ?? 0;
        })
      );
    })
  );

  return duplicatesGroup;
};
