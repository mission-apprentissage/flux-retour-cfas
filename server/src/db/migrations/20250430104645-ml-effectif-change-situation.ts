import { SITUATION_ENUM } from "shared/models";

import { missionLocaleEffectifsDb } from "@/common/model/collections";

export const up = async () => {
  await missionLocaleEffectifsDb().updateMany(
    { situation: "PAS_BESOIN_SUIVI" as SITUATION_ENUM },
    { $set: { situation: SITUATION_ENUM.NOUVEAU_PROJET } }
  );
};
