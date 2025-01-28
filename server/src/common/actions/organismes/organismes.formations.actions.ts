import { formationsCatalogueDb } from "@/common/model/collections";

export async function searchOrganismesFormations(searchTerm: string): Promise<any[]> {
  const formations = await formationsCatalogueDb()
    .aggregate([
      {
        $match: {
          $or: [
            { intitule_long: { $regex: searchTerm, $options: "i" } },
            { cfd: searchTerm },
            { rncp_code: searchTerm },
          ],
        },
      },
      {
        $group: {
          _id: {
            cfd: "$cfd",
            rncp: "$rncp_code",
          },
          cle_ministere_educatif: { $last: "$cle_ministere_educatif" },
          intitule_long: { $last: "$intitule_long" },
          cfd: { $last: "$cfd" },
          rncp: { $last: "$rncp_code" },
          cfd_start_date: { $last: { $arrayElemAt: ["$periode", 0] } },
          cfd_end_date: { $last: { $arrayElemAt: ["$periode", 1] } },
        },
      },
      {
        $project: {
          _id: 0,
        },
      },
      {
        $sort: {
          intitule_long: 1,
        },
      },
      {
        $limit: 50,
      },
    ])
    .toArray();

  return formations;
}
