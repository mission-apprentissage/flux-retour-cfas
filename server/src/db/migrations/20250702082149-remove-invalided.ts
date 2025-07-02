import { usersMigrationDb } from "@/common/model/collections";

export const up = async () => {
  usersMigrationDb().updateMany(
    {},
    {
      $unset: {
        invalided_token: 1,
      },
    },
    {
      bypassDocumentValidation: true,
    }
  );
};
