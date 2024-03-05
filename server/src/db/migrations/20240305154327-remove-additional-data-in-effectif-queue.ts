import { effectifsQueueDb } from "@/common/model/collections";

// Delete additional data , errors doesn't exist, should be error

export const up = async () => {
  await effectifsQueueDb().updateMany(
    {},
    {
      $unset: {
        errors: 1,
      },
    }
  );
};
