import { Db } from "mongodb";

export const up = async (db: Db) => {
  await db.collection("telechargementListeNomLogs").updateMany({}, [
    {
      $set: {
        elementList: {
          $map: {
            input: { $ifNull: ["$effectifs", []] },
            as: "eff",
            in: { $toString: "$$eff" },
          },
        },
      },
    },
    {
      $unset: "effectifs",
    },
  ]);
};
