import { apiAlternanceClient } from "@/common/apis/apiAlternance/client";
import { organisationsDb } from "@/common/model/collections";

export const up = async () => {
  const allMl = await apiAlternanceClient.geographie.listMissionLocales({});

  const mlById = new Map();
  for (const ml of allMl) {
    mlById.set(ml.id, ml);
  }

  const cursor = organisationsDb().find({ type: "MISSION_LOCALE" });

  while (await cursor.hasNext()) {
    const mlOrganisation = await cursor.next();
    if (!mlOrganisation) continue;

    if (!("ml_id" in mlOrganisation)) {
      continue;
    }
    const matchedMl = mlById.get(mlOrganisation.ml_id);
    if (!matchedMl) {
      continue;
    }

    const { email, telephone, siteWeb } = matchedMl.contact || {};

    await organisationsDb().updateOne(
      { _id: mlOrganisation._id },
      {
        $set: {
          email: (email || "").toLowerCase(),
          telephone: telephone || "",
          site_web: (siteWeb || "").toLowerCase(),
        },
      }
    );
  }
};
