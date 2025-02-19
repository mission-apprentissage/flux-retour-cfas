import { SITUATION_ENUM, OLD_SITUATION_ENUM } from "shared/models";

import { missionLocaleEffectifsDb, missionLocaleEffectifsLogsDb } from "@/common/model/collections";

export const up = async () => {
  await missionLocaleEffectifsDb().updateMany(
    {
      situation: OLD_SITUATION_ENUM.CONTACTE_AVEC_SUIVI,
    },
    {
      $set: {
        situation: SITUATION_ENUM.CONTACTE,
      },
    }
  );

  await missionLocaleEffectifsDb().updateMany(
    {
      situation: OLD_SITUATION_ENUM.NON_CONTACTE,
    },
    {
      $set: {
        situation: SITUATION_ENUM.A_CONTACTER,
      },
    }
  );

  await missionLocaleEffectifsLogsDb().updateMany(
    {
      "payload.situation": OLD_SITUATION_ENUM.CONTACTE_AVEC_SUIVI,
    },
    {
      $set: {
        "payload.situation": SITUATION_ENUM.CONTACTE,
      },
    }
  );

  await missionLocaleEffectifsLogsDb().updateMany(
    {
      "payload.situation": OLD_SITUATION_ENUM.NON_CONTACTE,
    },
    {
      $set: {
        "payload.situation": SITUATION_ENUM.A_CONTACTER,
      },
    }
  );
};
