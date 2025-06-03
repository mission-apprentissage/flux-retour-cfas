import { v4 as uuidv4 } from "uuid";

import { missionLocaleEffectifsDb } from "@/common/model/collections";

export const up = async () => {
  const cursor = missionLocaleEffectifsDb().find({ "brevo.token": { $exists: false } });
  const date = new Date();
  while (await cursor.hasNext()) {
    const mlEff = await cursor.next();
    if (mlEff) {
      await missionLocaleEffectifsDb().updateOne(
        { _id: mlEff._id },
        { $set: { "brevo.token": uuidv4(), "brevo.token_created_at": date } }
      );
    }
  }
};
