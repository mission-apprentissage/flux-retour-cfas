import { effectifsDb } from "@/common/model/collections";

/**
 * Récupération de la liste des doublons pour 2 organismes
 * @param organismeSource
 * @param organismeWithDuplicates
 */
export const getEffectifsDuplicatesFromOrganismes = async (organismeSource, organismeWithDuplicates) => {
  return await effectifsDb()
    .aggregate([
      { $match: { organisme_id: { $in: [organismeSource, organismeWithDuplicates] } } },
      {
        $group: {
          _id: {
            nom_apprenant: "$apprenant.nom",
            prenom_apprenant: { $toLower: "$apprenant.prenom" },
            date_de_naissance_apprenant: "$apprenant.date_de_naissance",
            annee_scolaire: "$annee_scolaire",
          },
          count: { $sum: 1 },
          duplicatesInfo: { $addToSet: { id: "$_id", created_at: "$created_at" } },
        },
      },
      { $match: { count: { $gt: 1 } } },
    ])
    .toArray();
};
