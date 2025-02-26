import { ObjectId } from "mongodb";

import { apiAlternanceClient } from "@/common/apis/apiAlternance/client";
import { organisationsDb } from "@/common/model/collections";

export const up = async () => {
  const allMl = await apiAlternanceClient.geographie.listMissionLocales({});
  const currentDate = new Date();
  for (const ml of allMl) {
    await organisationsDb().findOneAndUpdate(
      {
        type: "MISSION_LOCALE",
        ml_id: ml.id,
      },
      {
        $setOnInsert: {
          _id: new ObjectId(),
          type: "MISSION_LOCALE",
          created_at: currentDate,
          ml_id: ml.id,
          nom: ml.nom,
          siret: ml.siret,
        },
      },
      {
        upsert: true,
      }
    );
  }
};
