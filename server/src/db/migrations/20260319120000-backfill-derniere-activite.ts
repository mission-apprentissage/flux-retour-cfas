import { getDatabase } from "@/common/mongodb";

export const up = async () => {
  const db = getDatabase();
  const missionLocaleEffectifLog = db.collection("missionLocaleEffectifLog");
  const organisations = db.collection("organisations");

  // Aggregation: pour chaque ML, trouver le max created_at des logs avec created_by != null
  const results = await missionLocaleEffectifLog
    .aggregate([
      { $match: { created_by: { $ne: null } } },
      { $sort: { created_at: -1 } },
      {
        $group: {
          _id: "$mission_locale_effectif_id",
          latest_created_at: { $first: "$created_at" },
        },
      },
      {
        $lookup: {
          from: "missionLocaleEffectif",
          localField: "_id",
          foreignField: "_id",
          pipeline: [{ $project: { mission_locale_id: 1 } }],
          as: "effectif",
        },
      },
      { $unwind: "$effectif" },
      {
        $group: {
          _id: "$effectif.mission_locale_id",
          derniere_activite: { $max: "$latest_created_at" },
        },
      },
    ])
    .toArray();

  console.log(`Found derniere_activite for ${results.length} Mission Locales`);

  if (results.length === 0) return;

  const bulkOps = results.map((r) => ({
    updateOne: {
      filter: { _id: r._id },
      update: { $set: { derniere_activite: r.derniere_activite } },
    },
  }));

  const bulkResult = await organisations.bulkWrite(bulkOps);
  console.log(`Updated derniere_activite for ${bulkResult.modifiedCount} Mission Locales`);
};
