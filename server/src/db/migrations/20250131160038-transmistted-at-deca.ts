import { effectifsDECADb } from "@/common/model/collections";

export const up = async () => {
  effectifsDECADb().updateMany(
    {},
    {
      $set: { transmitted_at: new Date("$updated_at") },
    }
  );
};
