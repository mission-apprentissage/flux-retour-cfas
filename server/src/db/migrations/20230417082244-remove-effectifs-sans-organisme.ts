import { Db, MongoClient } from "mongodb";

export const up = async (db: Db, _client: MongoClient) => {
  const effectifsIdWithoutOrganisme = (
    await db
      .collection("effectifs")
      .aggregate([
        {
          $lookup: {
            from: "organismes",
            localField: "organisme_id",
            foreignField: "_id",
            as: "organisme",
          },
        },
        {
          $match: {
            "organisme.0": {
              $exists: false,
            },
          },
        },
      ])
      .toArray()
  ).map((item) => item._id);

  await db.collection("effectifs").deleteMany({ _id: { $in: effectifsIdWithoutOrganisme } });
};
